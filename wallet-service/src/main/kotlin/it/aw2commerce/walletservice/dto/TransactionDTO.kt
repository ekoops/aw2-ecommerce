package it.aw2commerce.walletservice.dto

import java.time.LocalDateTime

data class TransactionDTO(
    val id: Long,
    val walletId: Long,
    val amount: Double,
    val referenceId: String,
    val timeInstant: LocalDateTime,
)