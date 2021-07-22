package it.aw2commerce.walletservice.services

import it.aw2commerce.walletservice.dto.WalletDTO

interface WalletService {

    fun getWallet(walletId: Long): WalletDTO
}