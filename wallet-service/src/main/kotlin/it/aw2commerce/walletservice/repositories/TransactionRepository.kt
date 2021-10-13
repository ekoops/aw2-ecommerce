package it.aw2commerce.walletservice.repositories

import it.aw2commerce.walletservice.domain.Transaction
import it.aw2commerce.walletservice.domain.Wallet
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.PagingAndSortingRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.util.*


@Repository
interface TransactionRepository : PagingAndSortingRepository<Transaction, Long> {
    fun findByIdAndWallet(
        id: Long,
        wallet: Wallet
    ): Optional<Transaction>

    @Query(
        """
        SELECT t
        FROM Transaction t
        WHERE (t.timeInstant BETWEEN :startDate AND :endDate) AND
            (t.wallet = :wallet)
    """
    )
    fun customFindByWalletAndTimeInstantBetween(
        @Param(value = "wallet") wallet: Wallet,
        @Param(value = "startDate") startDate: LocalDateTime,
        @Param(value = "endDate") endDate: LocalDateTime,
        pageable: Pageable
    ): Page<Transaction>

    fun findAllByWallet(
        wallet: Wallet,
        pageable: Pageable
    ): Page<Transaction>


    fun findAllByReferenceId(
        referenceId: String,
    ): List<Transaction>

    @Transactional
    fun deleteAllByReferenceId(
        referenceId: String
    )

    companion object {
        const val TRANSACTION_PAGE_SIZE: Int = 10
    }
}