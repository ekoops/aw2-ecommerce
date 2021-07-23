package it.aw2commerce.walletservice.dto

data class WalletDTO(
    val id: Long,
    val customerId: Long,
    val amount: Double
)