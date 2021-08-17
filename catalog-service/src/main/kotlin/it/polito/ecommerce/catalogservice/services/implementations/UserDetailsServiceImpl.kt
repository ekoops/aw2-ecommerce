package it.polito.ecommerce.catalogservice.services.implementations

import it.polito.ecommerce.catalogservice.domain.*
import it.polito.ecommerce.catalogservice.dto.UserDTO
import it.polito.ecommerce.catalogservice.dto.UserDetailsDTO
import it.polito.ecommerce.catalogservice.dto.incoming.CreateUserRequestDTO
import it.polito.ecommerce.catalogservice.dto.kafkadtos.RequestDTO
import it.polito.ecommerce.catalogservice.exceptions.internal.CreateUserInternalException
import it.polito.ecommerce.catalogservice.exceptions.internal.VerifyUserInternalException
import it.polito.ecommerce.catalogservice.exceptions.user.NoSuchRoleException
import it.polito.ecommerce.catalogservice.exceptions.user.UserAlreadyExistsException
import it.polito.ecommerce.catalogservice.exceptions.user.emailverificationtoken.EmailVerificationTokenExpiredException
import it.polito.ecommerce.catalogservice.repositories.CoroutineUserRepository
import it.polito.ecommerce.catalogservice.repositories.CustomerRepository
import it.polito.ecommerce.catalogservice.repositories.UserRepository
import it.polito.ecommerce.catalogservice.services.NotificationService
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.reactive.asFlow
import kotlinx.coroutines.reactor.mono
import org.springframework.beans.factory.annotation.Value
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.mail.MailException
import org.springframework.security.core.userdetails.ReactiveUserDetailsService
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.security.crypto.password.PasswordEncoder
import reactor.core.publisher.Mono
import reactor.core.publisher.SynchronousSink
import java.time.LocalDateTime
import java.util.*


@Service
@Transactional
class UserDetailsServiceImpl(
    @Value("\${server.host}") private val host: String,
    @Value("\${server.port}") private val port: Int,
    @Value("\${spring.webflux.base-path}") private val contextPath: String,
    private val userRepository: UserRepository,
    private val coroutineUserRepository: CoroutineUserRepository,
    private val customerRepository: CustomerRepository,
    private val notificationService: NotificationService,
    private val passwordEncoder: PasswordEncoder,
    private val kafkaTemplate: KafkaTemplate <String, RequestDTO>
) : ReactiveUserDetailsService {
    private val baseEmailVerificationUrl = "http://$host:$port$contextPath/auth/confirmRegistration?token="

    private suspend fun getUserByUsername(username: String): User {
        return coroutineUserRepository.findByUsername(username)
            ?: throw UsernameNotFoundException("User($username) not found")
    }

    override fun findByUsername(username: String): Mono<UserDetails> {
        return this.userRepository.findByUsername(username).map { it.toUserDetailsDTO() }
    }

    suspend fun getUserById(id: Long): User {
        return coroutineUserRepository.findById(id) ?: throw UsernameNotFoundException("User(id=$id) not found")
    }

    suspend fun createUserSuspend(userDTO: CreateUserRequestDTO): UserDTO {
        val (email, username) = userDTO
        val isUserAlreadyPresent = coroutineUserRepository.existsByUsernameOrEmail(
            username = username,
            email = email
        )
        if (isUserAlreadyPresent) throw UserAlreadyExistsException(
            username = username,
            email = email
        )
        // If user is not present, I create it
        val user = User(
            username = username,
            password = passwordEncoder.encode(userDTO.password),
            email = email,
            rolesList = listOf(Rolename.CUSTOMER)
        )
        val createdUser = coroutineUserRepository.save(user)
        val customer = Customer(
            name = userDTO.name,
            surname = userDTO.surname,
            deliveryAddress = userDTO.deliveryAddress,
            user = createdUser
        )
        val createdCustomer = customerRepository.save(customer)
        try {
//            // Creating email verification token
            val emailVerificationTokenDTO = notificationService
                .createEmailVerificationToken(createdUser.username)

            // Sending kafka message on topic "user-created" for email verification
            val userVerificationUrl = "$baseEmailVerificationUrl${emailVerificationTokenDTO.token}"
            val requestDTO = RequestDTO(
                id=5,
                userVerificationUrl= userVerificationUrl,
                userEmail = email,
                mailBody = """
                Verifica l'account immediatamente
                $userVerificationUrl
                """.trimIndent()
                )

            kafkaTemplate.send("user-created", requestDTO).get()
//            mailService.sendMessage(
//                toMail = email,
//                subject = "[SauceOverflow] Verifica l'account appena creato",
//                mailBody = """
//                Verifica l'account immediatamente
//                $userVerificationUrl
//            """.trimIndent()
//            )
        } catch (ex: Exception) {
            when (ex) {
                is UsernameNotFoundException, is MailException -> throw CreateUserInternalException.from(ex)
                else -> throw ex
            }
        }
        return createdUser.toUserDTO()
    }


    suspend fun verifyUser(token: String) {
        // Getting corresponding email verification token
        val emailVerificationTokenDTO = notificationService.getEmailVerificationToken(
            token = token
        )
//
//        // Verifying if email verification token is expired
        if (emailVerificationTokenDTO.expirationDate < LocalDateTime.now()) {
            throw EmailVerificationTokenExpiredException(
                token = token,
                expirationDate = emailVerificationTokenDTO.expirationDate
            )
        }
//
//        // Enabling corresponding user
        try {
            enableUser(emailVerificationTokenDTO.username)
        } catch (ex: UsernameNotFoundException) {
            throw VerifyUserInternalException()
        }
        notificationService.removeEmailVerificationToken(token)
    }

    suspend fun enableUser(username: String): Boolean {
        val enabledUser = getUserByUsername(username).enableUser() ?: return false
        coroutineUserRepository.save(enabledUser)
        return false
    }

    suspend fun disableUser(username: String): Boolean {
        val newUser = this.getUserByUsername(username).disableUser() ?: return false
        userRepository.save(newUser)
        return true
    }


    suspend fun addUserRole(username: String, role: String): Boolean {
        try {
            val rolename = Rolename.valueOf(role)
            val newUser = this.getUserByUsername(username).addRolename(rolename) ?: return false
            userRepository.save(newUser)
            return true
        } catch (ex: IllegalArgumentException) {
            throw NoSuchRoleException(role = role)
        }
    }

    suspend fun removeUserRole(username: String, role: String): Boolean {
        try {
            val rolename = Rolename.valueOf(role)
            val newUser = this.getUserByUsername(username).removeRolename(rolename) ?: return false
            userRepository.save(newUser)
            return true
        } catch (ex: IllegalArgumentException) {
            throw NoSuchRoleException(role = role)
        }
    }

    suspend fun lockUser(id: Long): User? = this.getUserById(id).lockUser()


    suspend fun unlockUser(id: Long): User? = this.getUserById(id).unlockUser()
}

