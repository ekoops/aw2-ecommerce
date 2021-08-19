package it.polito.ecommerce.catalogservice.dto

import it.polito.ecommerce.catalogservice.dto.kafkadtos.UserCreatedEmailVerificationTokenInfoDTO
import java.time.LocalDateTime

data class EmailVerificationTokenDTO(
    val id: Long,
    val expirationDate: LocalDateTime,
    val token: String,
)

fun EmailVerificationTokenDTO.toCreatedUserEmailVerificationTokenInfoDTO() = UserCreatedEmailVerificationTokenInfoDTO(
    expirationDate = this.expirationDate,
    token = this.token
)