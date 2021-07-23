package it.aw2commerce.walletservice.repositories

import it.aw2commerce.walletservice.domain.Wallet
import org.springframework.data.repository.CrudRepository
import org.springframework.stereotype.Repository

@Repository
interface WalletRepository : CrudRepository<Wallet, Long>