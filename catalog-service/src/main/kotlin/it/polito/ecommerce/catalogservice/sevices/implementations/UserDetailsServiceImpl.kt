package it.polito.ecommerce.catalogservice.sevices.implementations

import it.polito.ecommerce.catalogservice.domain.Customer
import it.polito.ecommerce.catalogservice.domain.Rolename
import it.polito.ecommerce.catalogservice.domain.User
import it.polito.ecommerce.catalogservice.dto.UserDTO
import it.polito.ecommerce.catalogservice.dto.UserDetailsDTO
import it.polito.ecommerce.catalogservice.exceptions.user.UserAlreadyExistsException
import it.polito.ecommerce.catalogservice.repositories.CustomerRepository
import it.polito.ecommerce.catalogservice.repositories.UserRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.security.crypto.password.PasswordEncoder

/*
@Service
@Transactional
class UserDetailsServiceImpl(
    @Value("\${server.host}") private val host: String,
    @Value("\${server.port}") private val port: Int,
    @Value("\${server.servlet.context-path}") private val contextPath: String,
    private val userRepository: UserRepository,
    private val customerRepository: CustomerRepository,
    //private val notificationService: NotificationService,
    //private val mailService: MailService,
    private val passwordEncoder: PasswordEncoder
) : UserDetailsService {
    private val baseEmailVerificationUrl = "http://$host:$port$contextPath/auth/confirmRegistration?token="

    private fun getUserByUsername(username: String): User = userRepository.findByUsername(username)
        ?: throw UsernameNotFoundException("User($username) not found")

    override fun loadUserByUsername(username: String): UserDetailsDTO =
        this.getUserByUsername(username).toUserDetailsDTO()

    fun getUserById(id: Long): User {
        val user = userRepository.findById(id)
        if (!user.isPresent) {
            throw UsernameNotFoundException("User(id=$id) not found")
        }
        return user.get()
    }

    fun createUser(userDTO: CreateUserRequestDTO): UserDTO {
        val (email, username) = userDTO
        // Checking if user already exists
        val isUserAlreadyPresent = userRepository.existsByUsernameOrEmail(
            username = username,
            email = email
        )
        if (isUserAlreadyPresent) throw UserAlreadyExistsException(
            username = username,
            email = email
        )

        // Creating user
        val user = User(
            name = username,
            password = passwordEncoder.encode(userDTO.password),
            email = email,
            role = Rolename.CUSTOMER
        )

        // Creating user associated customer
        // THE CUSTOMER WAS CREATED IN ORDER TO
        // BE CONSISTENT WITH THE CUSTOMER ROLE
        val customer = Customer(
            name = userDTO.name,
            surname = userDTO.surname,
            deliveryAddress = userDTO.deliveryAddress,
            user = user
        )

        val createdCustomer = customerRepository.save(customer)
        val createdUser = createdCustomer.user

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
        return createdUser.toUserDTO()
    }



    fun verifyUser(token: String) {
        // Getting corresponding email verification token
        val emailVerificationTokenDTO = notificationService.getEmailVerificationToken(
            token = token
        )

        // Verifying if email verification token is expired
        if (emailVerificationTokenDTO.expirationDate < LocalDateTime.now()) {
            throw EmailVerificationTokenExpiredException(
                token = token,
                expirationDate = emailVerificationTokenDTO.expirationDate
            )
        }

        // Enabling corresponding user
        try {
            enableUser(emailVerificationTokenDTO.username)
        } catch (ex: UsernameNotFoundException) {
            throw VerifyUserInternalException()
        }
        notificationService.removeEmailVerificationToken(token)
    }

    fun enableUser(username: String): Boolean
            = this
        .getUserByUsername(username)
        .enableUser()

    fun disableUser(username: String): Boolean
            = this
        .getUserByUsername(username)
        .disableUser()

    fun addUserRole(username: String, role: String): Boolean {
        try {
            val rolename = Rolename.valueOf(role)
            val user = this.getUserByUsername(username)
            return user.addRolename(rolename = rolename)
        } catch (ex: IllegalArgumentException) {
            throw NoSuchRoleException(role = role)
        }
    }

    fun removeUserRole(username: String, role: String): Boolean {
        try {
            val rolename = Rolename.valueOf(role)
            val user = this.getUserByUsername(username)
            return user.removeRolename(rolename = rolename)
        } catch (ex: IllegalArgumentException) {
            throw NoSuchRoleException(role = role)
        }
    }

    fun lockUser(id: Long)
            = this
        .getUserById(id)
        .lockUser()

    fun unlockUser(id: Long)
            = this
        .getUserById(id)
        .unlockUser()

}

*/