package it.aw2commerce.walletservice.services.implementations;


import it.aw2commerce.walletservice.domain.Wallet
import it.aw2commerce.walletservice.domain.toWalletDTO
import it.aw2commerce.walletservice.dto.WalletDTO
import it.aw2commerce.walletservice.exceptions.wallet.WalletNotFoundException
import it.aw2commerce.walletservice.repositories.WalletRepository
import it.aw2commerce.walletservice.services.WalletService
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class WalletServiceImpl(
    private val walletRepository: WalletRepository
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


}
