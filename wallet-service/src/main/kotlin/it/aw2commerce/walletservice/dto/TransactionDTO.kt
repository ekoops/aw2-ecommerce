package it.aw2commerce.walletservice.dto

import java.time.LocalDateTime

data class TransactionDTO(
    val id: Long,
    val purchasingWalletId: Long,
    val rechargingWalletId: Long,
    val amount: Double,
    val timeInstant: LocalDateTime,
)