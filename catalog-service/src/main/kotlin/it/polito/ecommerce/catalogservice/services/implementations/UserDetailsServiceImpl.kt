package it.polito.ecommerce.catalogservice.services.implementations

import it.polito.ecommerce.catalogservice.domain.*
import it.polito.ecommerce.catalogservice.dto.UserDTO
import it.polito.ecommerce.catalogservice.dto.UserDetailsDTO
import it.polito.ecommerce.catalogservice.dto.incoming.CreateUserRequestDTO
import it.polito.ecommerce.catalogservice.exceptions.user.NoSuchRoleException
import it.polito.ecommerce.catalogservice.exceptions.user.UserAlreadyExistsException
import it.polito.ecommerce.catalogservice.repositories.CustomerRepository
import it.polito.ecommerce.catalogservice.repositories.UserRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.reactive.asFlow
import kotlinx.coroutines.reactor.mono
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.userdetails.ReactiveUserDetailsService
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.security.crypto.password.PasswordEncoder
import reactor.core.publisher.Mono
import reactor.core.publisher.SynchronousSink
import java.util.*


@Service
@Transactional
class UserDetailsServiceImpl(
    @Value("\${server.host}") private val host: String,
    @Value("\${server.port}") private val port: Int,
    @Value("\${spring.webflux.base-path}") private val contextPath: String,
    private val userRepository: UserRepository,
    private val customerRepository: CustomerRepository,
    //private val notificationService: NotificationService,
    //private val mailService: MailService,
    private val passwordEncoder: PasswordEncoder
) : ReactiveUserDetailsService {
   private val baseEmailVerificationUrl = "http://$host:$port$contextPath/auth/confirmRegistration?token="

    private fun getUserByUsername(username: String): Mono<User>  {
        return userRepository.findByUsername(username)
            ?: throw UsernameNotFoundException("User($username) not found")
    }

    override fun findByUsername(username: String): Mono<UserDetails> = this.getUserByUsername(username).map { it.toUserDetailsDTO() }

    fun getUserById(id: Long): Mono<User> {
        return userRepository.findById(id) ?: throw UsernameNotFoundException("User(id=$id) not found")
    }

    fun createUser(userDTO: CreateUserRequestDTO): Mono<UserDTO> {
        println("EEEEEEE")
        val (email, username) = userDTO
        // Checking if user already exists
//        val isUserAlreadyPresent = userRepository.existsByUsernameOrEmail(
//            username = username,
//            email = email
//        )
//

//        if (isUserAlreadyPresent) throw UserAlreadyExistsException(
//            username = username,
//            email = email
//        )

        // Creating user
        val user = Mono.just(User(
            username = username,
            password = passwordEncoder.encode(userDTO.password),
            email = email,
            rolesList = listOf(Rolename.CUSTOMER)
        )).flatMap { user: User ->
                userRepository.existsByUsernameOrEmail(
                    username = username,
                    email = email
                ).flatMap{ result ->
                        if (result) {
                            Mono.error(
                                UserAlreadyExistsException(
                                    username = username,
                                    email = email
                                )
                            )
                        } else Mono.just(user)
                }
        }



        val createdUser = user.flatMap{
            userRepository.save(it)}

        // Creating user associated customer
        // THE CUSTOMER WAS CREATED IN ORDER TO
        // BE CONSISTENT WITH THE CUSTOMER ROLE
        val customer = createdUser.map{Customer(
            name = userDTO.name,
            surname = userDTO.surname,
            deliveryAddress = userDTO.deliveryAddress,
            user = it
        )}

        val createdCustomer = customer.map{
            println("saving custormer")
            customerRepository.save(it)
        }
        return createdUser.map { it.toUserDTO() }
        /*
        try {
            // Creating email verification token
            val emailVerificationTokenDTO = notificationService
                .createEmailVerificationToken(createdUser.username)

            // Sending verification email
            val userVerificationUrl = "$baseEmailVerificationUrl${emailVerificationTokenDTO.token}"
            mailService.sendMessage(
                toMail = email,
                subject = "[SauceOverflow] Verifica l'account appena creato",
                mailBody = """
                Verifica l'account immediatamente
                $userVerificationUrl
            """.trimIndent()
            )
        }
        catch (ex: Exception) {
            when(ex) {
                is UsernameNotFoundException, is MailException -> throw CreateUserInternalException.from(ex)
                else -> throw ex
            }
        }
         */

        // Returning userDTO representation
 //      return customer.map{customerRepository.save(it)}.and { createdUser }.map{it.toUserDTO()}

//        return createdUser
//                .map{it.toUserDTO()}
//                .{customer.map{customerRepository.save(it)}}
//                .map{customer,user -> user}

    }


    fun verifyUser(token: String) {
        // Getting corresponding email verification token
//        val emailVerificationTokenDTO = notificationService.getEmailVerificationToken(
//            token = token
//        )
//
//        // Verifying if email verification token is expired
//        if (emailVerificationTokenDTO.expirationDate < LocalDateTime.now()) {
//            throw EmailVerificationTokenExpiredException(
//                token = token,
//                expirationDate = emailVerificationTokenDTO.expirationDate
//            )
//        }
//
//        // Enabling corresponding user
//        try {
//            enableUser(emailVerificationTokenDTO.username)
//        } catch (ex: UsernameNotFoundException) {
//            throw VerifyUserInternalException()
//        }
//        notificationService.removeEmailVerificationToken(token)
    }

    fun enableUser (username: String): Mono<Boolean> {
        val user = this.getUserByUsername(username)
        return user.map{
            val enabledUser = it.enableUser()
            if(enabledUser!=null) {
                println(enabledUser)
                userRepository.save(enabledUser)
                true
            }else {
                false
            }
        }
    }


//    suspend fun disableUser (username: String): Boolean{
//        val newUser = this.getUserByUsername(username).disableUser() ?: return false
//        userRepository.save(newUser)
//        return true
//    }
//
//    suspend fun addUserRole(username: String, role: String): Boolean {
//        try {
//            val rolename = Rolename.valueOf(role)
//            val newUser = this.getUserByUsername(username).addRolename(rolename) ?: return false
//            userRepository.save(newUser)
//            return true
//        } catch (ex: IllegalArgumentException) {
//            throw NoSuchRoleException(role = role)
//        }
//    }
//
//    suspend fun removeUserRole(username: String, role: String): Boolean {
//        try {
//            val rolename = Rolename.valueOf(role)
//            val newUser = this.getUserByUsername(username).removeRolename(rolename) ?: return false
//            userRepository.save(newUser)
//            return true
//        } catch (ex: IllegalArgumentException) {
//            throw NoSuchRoleException(role = role)
//        }
//    }
//
    fun lockUser(id: Long)
            = this
        .getUserById(id).flatMap{
        Mono.justOrEmpty(it.lockUser())
    }


    fun unlockUser(id: Long)
            = this
        .getUserById(id).flatMap {
            Mono.justOrEmpty(it.unlockUser())
        }


}

