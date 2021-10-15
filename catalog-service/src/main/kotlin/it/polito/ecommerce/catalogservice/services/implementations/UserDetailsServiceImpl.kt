package it.polito.ecommerce.catalogservice.services.implementations

import it.polito.ecommerce.catalogservice.domain.*
import it.polito.ecommerce.catalogservice.dto.UserDTO
import it.polito.ecommerce.catalogservice.dto.UserDetailsDTO
import it.polito.ecommerce.catalogservice.dto.incoming.CreateUserRequestDTO
import it.polito.ecommerce.catalogservice.dto.kafkadtos.UserCreatedDTO
import it.polito.ecommerce.catalogservice.dto.toCreatedUserEmailVerificationTokenInfoDTO
import it.polito.ecommerce.catalogservice.exceptions.internal.CreateUserInternalException
import it.polito.ecommerce.catalogservice.exceptions.internal.VerifyUserInternalException
import it.polito.ecommerce.catalogservice.exceptions.user.ActionNotPermittedException
import it.polito.ecommerce.catalogservice.exceptions.user.InconsistentUserException
import it.polito.ecommerce.catalogservice.exceptions.user.NoSuchRoleException
import it.polito.ecommerce.catalogservice.exceptions.user.UserAlreadyExistsException
import it.polito.ecommerce.catalogservice.exceptions.user.emailverificationtoken.EmailVerificationTokenExpiredException
import it.polito.ecommerce.catalogservice.kafka.dispatch
import it.polito.ecommerce.catalogservice.repositories.CoroutineUserRepository
import it.polito.ecommerce.catalogservice.repositories.UserRepository
import it.polito.ecommerce.catalogservice.services.NotificationService
import org.apache.kafka.common.KafkaException
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.mail.MailException
import org.springframework.security.core.context.ReactiveSecurityContextHolder
import org.springframework.security.core.userdetails.ReactiveUserDetailsService
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.security.crypto.password.PasswordEncoder
import reactor.core.publisher.Mono
import java.time.LocalDateTime


@Service
@Transactional
class UserDetailsServiceImpl(
    private val userRepository: UserRepository,
    private val coroutineUserRepository: CoroutineUserRepository,
    private val notificationService: NotificationService,
    private val passwordEncoder: PasswordEncoder,
    private val kafkaTemplate: KafkaTemplate<String, UserCreatedDTO>
) : ReactiveUserDetailsService {

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

    suspend fun createUser(userDTO: CreateUserRequestDTO): UserDTO {
        val email = userDTO.email
        val username = userDTO.username

        val isUserAlreadyPresent = coroutineUserRepository.existsByUsernameOrEmail(
            username = username,
            email = email
        )
        if (isUserAlreadyPresent) throw UserAlreadyExistsException(
            username = username,
            email = email
        )
        // If user is not present, I create it
        val name = userDTO.name
        val surname = userDTO.surname
        val deliveryAddress = userDTO.deliveryAddress

        val createdUser: User
        try {
            val user = User(
                username = username,
                email = email,
                password = passwordEncoder.encode(userDTO.password),
                rolesList = listOf(Rolename.CUSTOMER),
                name = name,
                surname = surname,
                deliveryAddress = deliveryAddress
            )
            createdUser = coroutineUserRepository.save(user)
        } catch (ex: Exception) {
            println(ex.message)
            throw InconsistentUserException("Error in saving the user")
        }

        // Creating email verification token
        try {
            val emailVerificationTokenDTO = notificationService
                .createEmailVerificationToken(createdUser.username)

            val userCreatedDTO = UserCreatedDTO(
                id = createdUser.id!!,
                username = createdUser.username,
                email = createdUser.email,
                roles = createdUser.getRolenames(),
                name = createdUser.name,
                surname = createdUser.surname,
                deliveryAddress = createdUser.deliveryAddress!!,
                emailVerificationTokenInfo = emailVerificationTokenDTO.toCreatedUserEmailVerificationTokenInfoDTO()
            )

            kafkaTemplate.dispatch("user-created", createdUser.id.toString(), userCreatedDTO)
        } catch (ex: Exception) {
            when (ex) {
                is UsernameNotFoundException, is MailException -> throw CreateUserInternalException.from(ex)
                is KafkaException -> {
                    println(ex.message)
                }
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

    // Verifying if email verification token is expired
    if (emailVerificationTokenDTO.expirationDate < LocalDateTime.now()) {
        throw EmailVerificationTokenExpiredException(
            token = token,
            expirationDate = emailVerificationTokenDTO.expirationDate
        )
    }

    // Enabling corresponding user
    try {
        enableUser(emailVerificationTokenDTO.id)
    } catch (ex: UsernameNotFoundException) {
        throw VerifyUserInternalException()
    }
    notificationService.removeEmailVerificationToken(token)
}

    suspend fun enableUser(id: Long): Boolean {
        val enabledUser = getUserById(id).enableUser() ?: return false
        try {
            coroutineUserRepository.save(enabledUser)
            return true
        } catch (ex: Exception) {
            throw InconsistentUserException("Error in enabling the user")
        }

    }

    suspend fun disableUser(id: Long): Boolean {
        val disabledUser = this.getUserById(id).disableUser() ?: return false
        try {
            coroutineUserRepository.save(disabledUser)
            return true
        } catch (ex: Exception) {
            throw InconsistentUserException("Error in disabling the user")
        }
    }


    suspend fun addUserRole(id: Long, role: String): Boolean {
        try {
            val rolename = Rolename.valueOf(role)
            val newUser = this.getUserById(id).addRolename(rolename) ?: return false
            try {
                coroutineUserRepository.save(newUser)
                return true
            } catch (ex: Exception) {
                throw InconsistentUserException("Error in adding role to the user")
            }

        } catch (ex: IllegalArgumentException) {
            throw NoSuchRoleException(role = role)
        }
    }

    suspend fun removeUserRole(username: String, role: String): Boolean {
        try {
            val rolename = Rolename.valueOf(role)
            val newUser = this.getUserByUsername(username).removeRolename(rolename) ?: return false
            try {
                coroutineUserRepository.save(newUser)
                return true
            } catch (ex: Exception) {
                throw InconsistentUserException("Error in removing role to the user")
            }

        } catch (ex: IllegalArgumentException) {
            throw NoSuchRoleException(role = role)
        }
    }

    suspend fun lockUser(id: Long): Boolean {
        val lockedUser = this.getUserById(id).lockUser() ?: throw ActionNotPermittedException("The user is already locked")
        try {
            coroutineUserRepository.save(lockedUser)
            return true
        } catch (ex: Exception) {
            throw InconsistentUserException("Error in locking the user")
        }
    }

    suspend fun unlockUser(id: Long): Boolean {
        val unlockedUser =
            this.getUserById(id).unlockUser() ?: throw ActionNotPermittedException("The user is already unlocked")
        try {
            coroutineUserRepository.save(unlockedUser)
            return true
        } catch (ex: Exception) {
            throw InconsistentUserException("Error in unlocking the user")
        }
    }

    suspend fun updateUserInformation(
        id: Long,
        name:String?,
        surname:String?,
        deliveryAddress:String?,
        password: String?
    ): Boolean {
//        val principal: UserDetailsDTO = ReactiveSecurityContextHolder.getContext().authentication.principal as UserDetailsDTO
//        val currentId = principal.getId()
//        if(currentId != id) throw ActionNotPermittedException("You must not execute this action")
        val newPassword: String?
        if (password!=null) {
            newPassword = passwordEncoder.encode(password)
        } else newPassword = null
        val updatedUser =
            this.getUserById(id).updateUserInfo(name,surname, deliveryAddress, newPassword)
        try {
            coroutineUserRepository.save(updatedUser)
            return true
        } catch (ex: Exception) {
            throw InconsistentUserException("Error in updating user info the user")
        }

    }

    suspend fun retrieveEmailAddress(id: Long): String? {
        try {
            val user = coroutineUserRepository.findById(id)
            return user?.email
        } catch (ex: Exception) {
            throw InconsistentUserException("Error retieving user email address")
        }
    }

    suspend fun retrieveUserInfo(id: Long): UserDTO? {
        try {
            val user = coroutineUserRepository.findById(id)
            return user?.toUserDTO()
        } catch (ex: Exception) {
            throw InconsistentUserException("Error retieving user info")
        }
    }
}

