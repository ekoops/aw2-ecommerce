package it.polito.ecommerce.catalogservice.dto

import java.time.LocalDateTime

data class EmailVerificationTokenDTO(
    val user_id: Long,
    //TODO: verificare dove viene usato lo username e cambiarlo con lo user id
    //val username: String,
    val expirationDate: LocalDateTime,
    val token: String,
)
