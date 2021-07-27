package it.aw2commerce.walletservice.services

import it.aw2commerce.walletservice.domain.Wallet
import it.aw2commerce.walletservice.dto.TransactionDTO
import it.aw2commerce.walletservice.dto.WalletDTO
import it.aw2commerce.walletservice.dto.incoming.CreateTransactionRequestDTO
import java.time.LocalDateTime

interface WalletService {
    fun createWallet(customerId: Long): WalletDTO
    fun getWallet(walletId: Long): WalletDTO
    fun getWalletEntity(walletId: Long): Wallet
    fun getCustomerIdFromWalletId(walletId: Long): Long?
    fun createWalletTransaction(
        purchasingWalletId: Long,
        createTransactionRequestDTO: CreateTransactionRequestDTO
    ): TransactionDTO


}

