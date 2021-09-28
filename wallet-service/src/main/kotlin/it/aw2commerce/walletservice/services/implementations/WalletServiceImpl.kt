package it.aw2commerce.walletservice.services.implementations


import it.aw2commerce.walletservice.domain.*
import it.aw2commerce.walletservice.dto.TransactionDTO
import it.aw2commerce.walletservice.dto.TransactionsPageDTO
import it.aw2commerce.walletservice.dto.UserDetailsDTO
import it.aw2commerce.walletservice.dto.WalletDTO
import it.aw2commerce.walletservice.dto.incoming.CreateTransactionRequestDTO
import it.aw2commerce.walletservice.exceptions.transaction.TransactionFailedException
import it.aw2commerce.walletservice.exceptions.transaction.TransactionNotFoundException
import it.aw2commerce.walletservice.exceptions.wallet.CustomerAlreadyHasWalletException
import it.aw2commerce.walletservice.exceptions.wallet.WalletNotFoundException
import it.aw2commerce.walletservice.repositories.TransactionRepository
import it.aw2commerce.walletservice.repositories.WalletRepository
import it.aw2commerce.walletservice.services.WalletService
import org.springframework.data.domain.PageRequest
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import kotlin.streams.toList


@Service
@Transactional
class WalletServiceImpl(
    private val walletRepository: WalletRepository,
    private val transactionRepository: TransactionRepository
) : WalletService {

    private fun getWalletEntity(walletId: Long): Wallet {
        val optionalWallet = walletRepository.findById(walletId)
        if (!optionalWallet.isPresent) {
            throw WalletNotFoundException(id = walletId)
        }
        return optionalWallet.get()
    }
    private fun getWalletEntityByCustomerId(customerId: Long): Wallet {
     return walletRepository.getWalletByCustomerId(customerId) ?: throw WalletNotFoundException(id = customerId)
    }

    private fun customerHasWallet(customerId: Long): Boolean {
        return walletRepository.getWalletByCustomerId(customerId) != null
    }


    override fun getCustomerIdFromWalletId(walletId: Long): Long? {
        try {
            return this.getWallet(walletId).customerId
        } catch (ex: WalletNotFoundException) {
            return null
        }
    }


    override fun getWallet(walletId: Long) = getWalletEntity(walletId).toWalletDTO()

    override fun createWallet(customerId: Long): WalletDTO {
//        val optionalCustomer = customerRepository.findById(customerId)
//        if (!optionalCustomer.isPresent) {
//            // Unprocessable entity 422
//            throw CustomerNotFoundException(id = customerId)
//        }

        if (customerHasWallet(customerId)) throw CustomerAlreadyHasWalletException(customerId)
        val newWallet = Wallet(
            customerId = customerId,
            transactions = emptySet(),
        )
        val createdWallet = walletRepository.save(newWallet)
        return createdWallet.toWalletDTO()
    }



    override fun createWalletTransaction(
        walletId: Long,
        createTransactionRequestDTO: CreateTransactionRequestDTO
    ): TransactionDTO {

        val auth: Authentication = SecurityContextHolder.getContext().authentication
//        val isAdmin = auth.authorities.first().authority.equals("ADMIN")
        val isAdmin = false
        val orderId = createTransactionRequestDTO.orderId
//todo check is admin
//        val purchasingWallet =  if(isAdmin) this.getWalletEntity(purchasingWalletId)
//          else getWalletEntity(purchasingWalletId)
        try {
            // 422 if not present...
            println(" before get wallet")
            val wallet = getWalletEntity(walletId)
            println(" after get wallet" + wallet.amount)
            val amountToLong = (createTransactionRequestDTO.amount * 100).toLong()
            if (wallet.amount < -amountToLong) {
                throw TransactionFailedException(
                    detail = "Insufficient balance to perform transaction"
                )
            }
            val newTransaction = Transaction(
                amount = amountToLong,
                timeInstant = LocalDateTime.now(),
                wallet = wallet ,
                orderId = orderId
            )
            val createdTransaction = transactionRepository.save(newTransaction)
//            if (!isAdmin) purchasingWallet.amount -= newTransaction.amount
            wallet.amount += newTransaction.amount
            return createdTransaction.toTransactionDTO()
        } catch (ex: WalletNotFoundException) {
            // returning the same message but allowing status code to be bad request
            throw TransactionFailedException(detail = ex.message)
        }
    }


    override fun getWalletTransactions(walletId: Long, pageNumber: Int): TransactionsPageDTO {
        val wallet = getWalletEntity(walletId)
        val transactionsPage = transactionRepository.findAllByWallet(
            wallet = wallet,
            pageable = PageRequest.of(pageNumber, TransactionRepository.TRANSACTION_PAGE_SIZE)
        )
        val walletTransactionsDTO = transactionsPage.get().map { it.toTransactionDTO() }.toList()
        return TransactionsPageDTO(
            pageNumber = pageNumber,
            transactions = walletTransactionsDTO
        )
    }


    override fun getWalletTransactionsInDateRange(
        walletId: Long,
        startDate: LocalDateTime,
        endDate: LocalDateTime,
        pageNumber: Int
    ): TransactionsPageDTO {
        val wallet = getWalletEntity(walletId)
        val transactionsPage = transactionRepository.customFindByWalletAndTimeInstantBetween(
            wallet = wallet,
            startDate = startDate,
            endDate = endDate,
            pageable = PageRequest.of(pageNumber, TransactionRepository.TRANSACTION_PAGE_SIZE)
        )
        val walletTransactionsDTO = transactionsPage.get().map { it.toTransactionDTO() }.toList()
        return TransactionsPageDTO(
            pageNumber = pageNumber,
            transactions = walletTransactionsDTO
        )
    }

    override fun getWalletTransaction(walletId: Long, transactionId: Long): TransactionDTO {
        val wallet = getWalletEntity(walletId)
        val optionalTransaction = transactionRepository.findByIdAndWallet(
            id = transactionId,
            wallet = wallet
        )
        if (!optionalTransaction.isPresent) {
            throw TransactionNotFoundException(id = transactionId)
        }
        return optionalTransaction.get().toTransactionDTO()
    }

}
