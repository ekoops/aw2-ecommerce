package it.polito.ecommerce.catalogservice.dto

import java.time.LocalDateTime

data class EmailVerificationTokenDTO(
    val id: Long,
    val username: String,
    val expirationDate: LocalDateTime,
    val token: String,
)
