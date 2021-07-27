package it.aw2commerce.walletservice.services.implementations;


import it.aw2commerce.walletservice.domain.Transaction
import it.aw2commerce.walletservice.domain.Wallet
import it.aw2commerce.walletservice.domain.toTransactionDTO
import it.aw2commerce.walletservice.domain.toWalletDTO
import it.aw2commerce.walletservice.dto.TransactionDTO
import it.aw2commerce.walletservice.dto.WalletDTO
import it.aw2commerce.walletservice.dto.incoming.CreateTransactionRequestDTO
import it.aw2commerce.walletservice.exceptions.transaction.TransactionFailedException
import it.aw2commerce.walletservice.exceptions.wallet.WalletNotFoundException
import it.aw2commerce.walletservice.repositories.TransactionRepository
import it.aw2commerce.walletservice.repositories.WalletRepository
import it.aw2commerce.walletservice.services.WalletService
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class WalletServiceImpl(
    private val walletRepository: WalletRepository,
    private val transactionRepository: TransactionRepository
) : WalletService {

    override fun getWalletEntity(walletId: Long): Wallet {
        val optionalWallet = walletRepository.findById(walletId)
        if (!optionalWallet.isPresent) {
            throw WalletNotFoundException(id = walletId)
        }
        return optionalWallet.get()
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
        val newWallet = Wallet(
            customer = customerId,
            purchasingTransactions = emptySet(),
            rechargingTransactions = emptySet(),
        )
        val createdWallet = walletRepository.save(newWallet)
        return createdWallet.toWalletDTO()
    }



    override fun createWalletTransaction(
        purchasingWalletId: Long,
        createTransactionRequestDTO: CreateTransactionRequestDTO
    ): TransactionDTO {
        // 404 if not present...
        val purchasingWallet = getWalletEntity(purchasingWalletId)
        try {
            // 422 if not present...
            val rechargingWallet = getWalletEntity(createTransactionRequestDTO.rechargingWalletId)

            val amountToLong = (createTransactionRequestDTO.amount * 100).toLong()
            if (purchasingWallet.amount < amountToLong) {
                throw TransactionFailedException(
                    detail = "Insufficient balance to perform transaction"
                )
            }

            val newTransaction = Transaction(
                amount = amountToLong,
                timeInstant = LocalDateTime.now(),
                purchasingWallet = purchasingWallet,
                rechargingWallet = rechargingWallet
            )
            val createdTransaction = transactionRepository.save(newTransaction)

            purchasingWallet.amount -= newTransaction.amount
            rechargingWallet.amount += newTransaction.amount

            return createdTransaction.toTransactionDTO()
        } catch (ex: WalletNotFoundException) {
            // returning the same message but allowing status code to be bad request
            throw TransactionFailedException(detail = ex.message)
        }
    }


}
