package it.polito.ecommerce.catalogservice.domain

import it.polito.ecommerce.catalogservice.dto.EmailVerificationTokenDTO
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

fun EmailVerificationToken.toEmailVerificationTokenDTO() = EmailVerificationTokenDTO(
    //username = this.user.username, //TODO come lo ricavo lo user?
    expirationDate = this.expirationDate,
    token = this.token
)