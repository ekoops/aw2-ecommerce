package it.aw2commerce.walletservice.services

import it.aw2commerce.walletservice.domain.Wallet
import it.aw2commerce.walletservice.dto.WalletDTO
import java.time.LocalDateTime

interface WalletService {
    fun createWallet(customerId: Long): WalletDTO
    fun getWallet(walletId: Long): WalletDTO
    fun getWalletEntity(walletId: Long): Wallet
    fun getCustomerIdFromWalletId(walletId: Long): Long?


}

