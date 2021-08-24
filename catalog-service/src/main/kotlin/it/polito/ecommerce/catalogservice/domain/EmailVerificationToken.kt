package it.polito.ecommerce.catalogservice.domain

import it.polito.ecommerce.catalogservice.dto.EmailVerificationTokenDTO
import it.polito.ecommerce.catalogservice.exceptions.user.InconsistentUserException
import it.polito.ecommerce.catalogservice.exceptions.user.emailverificationtoken.InconsistentEmailVerificationTokenException
import it.polito.ecommerce.catalogservice.repositories.UserRepository
import org.springframework.data.annotation.Id
import java.time.LocalDateTime
import java.util.*

data class EmailVerificationToken(
    @Id
    val id: Long? = null,

    val expirationDate: LocalDateTime = LocalDateTime.now().plusDays(1),

    val token: String = UUID.randomUUID().toString(),

    val user: User
)

fun EmailVerificationToken.toEmailVerificationTokenDTO(): EmailVerificationTokenDTO {
    val id = this.id ?: throw InconsistentEmailVerificationTokenException(
        "Email Verification Token id is undefined"
    )
    println("DENTRO IL toEmailVerificationTokenDTO:  $this")
    return EmailVerificationTokenDTO(
        id = id,
        expirationDate = this.expirationDate,
        token = this.token
    )
}