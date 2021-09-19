package it.aw2commerce.walletservice.listeners

import it.aw2commerce.walletservice.domain.Transaction
import it.aw2commerce.walletservice.domain.toTransactionDTO
import it.aw2commerce.walletservice.dto.incoming.CreateWalletRequestDTO
import it.aw2commerce.walletservice.dto.kafka.ApprovationDTO
import it.aw2commerce.walletservice.dto.kafka.BudgetAvailabilityProducedDTO
import it.aw2commerce.walletservice.dto.kafka.OrderApprovedByWalletDTO
import it.aw2commerce.walletservice.dto.kafka.OrderDTO
import it.aw2commerce.walletservice.repositories.TransactionRepository
import it.aw2commerce.walletservice.repositories.WalletRepository
import it.aw2commerce.walletservice.services.WalletService
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.messaging.handler.annotation.Header
import org.springframework.stereotype.Component
import org.springframework.web.bind.annotation.RequestHeader
import java.time.Instant
import java.time.LocalDateTime

//todo check ids of  @KafkaListener( id =

@Component
class RequestListener(
    private val budgetAvailabilityProducedKafkaTemplate: KafkaTemplate<String, BudgetAvailabilityProducedDTO>,
    private val orderApprovedByWalletKafkaTemplate: KafkaTemplate<String, OrderApprovedByWalletDTO>,
    private val walletRepository: WalletRepository,
    private val transactionRepository: TransactionRepository
) {

    @KafkaListener(
        id = "wallet-svc-grp",
        topics = ["budget-availability-requested"],
        containerFactory = "budgetAvailabilityRequestedContainerFactory",

        )
    fun listenBudgetAvailabilityRequested(@RequestHeader("key") key: String, orderDTO: OrderDTO) {
        val amount = orderDTO.items.fold(0.0) { acc, orderItemDTO ->
            acc + orderItemDTO.amount * orderItemDTO.perItemPrice
        }
        // check budget availability
        val wallet = this.walletRepository.getWalletByCustomerId(orderDTO.buyerId.toLong())
        if (wallet == null) {
            val orderApprovedByWalletDTO = OrderApprovedByWalletDTO(
                failure = "no wallet"
            )
            orderApprovedByWalletKafkaTemplate.send(
                "order-approved-by-wallet",
                key,
                orderApprovedByWalletDTO
            ).get()
            return
        }

        var budget:Long = this.transactionRepository.findAllByRechargingWallet(wallet).fold(0L) { acc, transaction -> acc + transaction.amount }
        budget-= this.transactionRepository.findAllByPurchasingWallet(wallet).fold(0L) {acc, transaction -> acc + transaction.amount  }


        val isBudgetAvailable = budget > amount*100
        val budgetAvailabilityProducedDTO = if (isBudgetAvailable)
            BudgetAvailabilityProducedDTO(
                ok = orderDTO
            ) else
            BudgetAvailabilityProducedDTO(
                failure = "no budget" // TODO: change error description
            )
      val kafkaMsg = budgetAvailabilityProducedKafkaTemplate.send(
            "budget-availability-produced",
            key,
            budgetAvailabilityProducedDTO
        ).get()
//        kafkaMsg.
        // TODO handle possibile kafka exception
    }

//    @KafkaListener(
//        id = "wallet-svc-grp2",
//        topics = ["order-approved"],
//        containerFactory = "orderApprovedContainerFactory"
//    )
//    fun listenOrderApproved(@Header("key") key: String, orderDTO: OrderDTO) {
//        //TODO controlla se RequestHeader / Header va bene
//        val wallet = this.walletRepository.getWalletByCustomerId(orderDTO.buyerId.toLong())
//        if (wallet == null) {
//            val orderApprovedByWalletDTO = OrderApprovedByWalletDTO(
//                failure = "no wallet"
//            )
//            orderApprovedByWalletKafkaTemplate.send(
//                "order-approved-by-wallet",
//                key,
//                orderApprovedByWalletDTO
//            ).get()
//            return
//        }
//        val amount = orderDTO.items.fold(0.0) { acc, orderItemDTO ->
//            acc + orderItemDTO.amount * orderItemDTO.perItemPrice
//        }
//        val transaction = Transaction(
//            purchasingWallet = wallet,
//            rechargingWallet = wallet, // TODO who has to be recharged???,
//            amount = (amount * 100).toLong(),
//            timeInstant = LocalDateTime.now(),
//        )
//        val createdTransaction = transactionRepository.save(transaction)
//
//        val orderApprovedByWalletDTO = if (createdTransaction.getId() == null) {
//            OrderApprovedByWalletDTO(
//                failure = "no wallet"
//            )
//        } else {
//            OrderApprovedByWalletDTO(
//                ok = ApprovationDTO("WALLET", orderDTO)
//            )
//
//        }
//        orderApprovedByWalletKafkaTemplate.send(
//            "order-approved-by-wallet",
//            key,
//            orderApprovedByWalletDTO
//        ).get()
//    }
//
//    @KafkaListener(
//        id = "wallet-svc-grp3",
//        topics = ["order-cancelled"],
//        containerFactory = "orderCancelledContainerFactory"
//    )
//    fun listenOrderCancelled(@Header("key") key: String, orderDTO: OrderDTO) {
//        //todo check header
//        //TODO a rollback must be done
//        /*
//        per ora il rollback è fatto creando una transazione opposta a quella da annullare
//         */
//        val wallet = this.walletRepository.getWalletByCustomerId(orderDTO.buyerId.toLong())
//
//        if (wallet == null) {
//            val orderApprovedByWalletDTO = OrderApprovedByWalletDTO(
//                failure = "no wallet"
//            )
//            orderApprovedByWalletKafkaTemplate.send(
//                "order-approved-by-wallet",
//                key,
//                orderApprovedByWalletDTO
//            ).get()
//            return
//        }
//
//        val amount = orderDTO.items.fold(0.0) { acc, orderItemDTO ->
//            acc + orderItemDTO.amount * orderItemDTO.perItemPrice
//        }
//        val transaction = Transaction(
//            purchasingWallet = wallet,
//            rechargingWallet = wallet, // TODO who has to be recharged???,
//            amount = -(amount * 100).toLong(),
//            timeInstant = LocalDateTime.now(),
//        )
//        val createdTransaction = transactionRepository.save(transaction)
//
//        val orderApprovedByWalletDTO = if (createdTransaction.getId() == null) {
//            OrderApprovedByWalletDTO(
//                failure = "no wallet"
//            )
//        } else {
//            OrderApprovedByWalletDTO(
//                ok = ApprovationDTO("WALLET", orderDTO)
//            )
//
//        }
//        orderApprovedByWalletKafkaTemplate.send(
//            "order-approved-by-wallet",
//            key,
//            orderApprovedByWalletDTO
//        ).get()
//    }
    }

