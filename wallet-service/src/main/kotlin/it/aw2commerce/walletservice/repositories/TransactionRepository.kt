package it.aw2commerce.walletservice.repositories

import it.aw2commerce.walletservice.domain.Transaction
import it.aw2commerce.walletservice.domain.Wallet
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.PagingAndSortingRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDateTime
import java.util.*

@Repository
interface TransactionRepository : PagingAndSortingRepository<Transaction, Long> {
    fun findByIdAndPurchasingWalletOrRechargingWallet(
        id: Long,
        purchasingWallet: Wallet,
        rechargingWallet: Wallet
    ): Optional<Transaction>

    @Query(
        """
        SELECT t
        FROM Transaction t
        WHERE (t.timeInstant BETWEEN :startDate AND :endDate) AND
            (t.purchasingWallet = :wallet OR t.rechargingWallet = :wallet)
    """
    )
    fun customFindByWalletAndTimeInstantBetween(
        @Param(value = "wallet") wallet: Wallet,
        @Param(value = "startDate") startDate: LocalDateTime,
        @Param(value = "endDate") endDate: LocalDateTime,
        pageable: Pageable
    ): Page<Transaction>

    fun findAllByPurchasingWalletOrRechargingWallet(
        purchasingWallet: Wallet,
        rechargingWallet: Wallet,
        pageable: Pageable
    ): Page<Transaction>

    companion object {
        const val TRANSACTION_PAGE_SIZE: Int = 10
    }
}