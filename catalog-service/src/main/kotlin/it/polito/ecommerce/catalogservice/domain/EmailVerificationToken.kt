package it.polito.ecommerce.catalogservice.domain

import it.polito.ecommerce.catalogservice.dto.EmailVerificationTokenDTO
import it.polito.ecommerce.catalogservice.repositories.UserRepository
import org.springframework.data.annotation.Id
import java.time.LocalDateTime
import java.util.*

data class EmailVerificationToken(
    @Id
    val id: Long? = null,

    val expirationDate: LocalDateTime = LocalDateTime.now().plusDays(1),

    val token: String = UUID.randomUUID().toString(),

    val user_id: Long
)

fun EmailVerificationToken.toEmailVerificationTokenDTO(userRepository: UserRepository) = EmailVerificationTokenDTO(
    user_id = this.user_id,
    //username = userRepository.findUsernameById(this.user_id).toString(), //TODO come lo ricavo lo user?
    expirationDate = this.expirationDate,
    token = this.token
)