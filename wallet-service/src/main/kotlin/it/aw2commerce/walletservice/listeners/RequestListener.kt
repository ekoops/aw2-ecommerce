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
        topics = ["budget-availability-requested"], //nome dove devo ascoltare
        containerFactory = "budgetAvailabilityRequestedContainerFactory", //è quello che creo nella configurazione

        )
    fun listenBudgetAvailabilityRequested(@RequestHeader("key") key: String, orderDTO: OrderDTO) {
        val amount = orderDTO.items.fold(0.0) { acc, orderItemDTO ->
            acc + orderItemDTO.amount * orderItemDTO.perItemPrice
        }
        // check budget availability
        val wallet = this.walletRepository.getWalletByCustomerId(orderDTO.buyerId.toLong())
        if (wallet == null ) {
            val orderApprovedByWalletDTO = OrderApprovedByWalletDTO(
                failure = "no wallet"
            )
            orderApprovedByWalletKafkaTemplate.send(
                "budget-availability-produced",
                key,
                orderApprovedByWalletDTO
            ).get()
            return
        }

        val budget:Long? = wallet.getId()?.let { walletRepository.findById(it).get().amount }

        if(budget == null){
            val orderApprovedByWalletDTO = OrderApprovedByWalletDTO(
                failure = "budget is null"
            )
            orderApprovedByWalletKafkaTemplate.send(
                "budget-availability-produced",
                key,
                orderApprovedByWalletDTO
            ).get()
            return
        }

        val isBudgetAvailable = budget > amount*100
        val budgetAvailabilityProducedDTO = if (isBudgetAvailable)
            BudgetAvailabilityProducedDTO(
                ok = orderDTO
            ) else
            BudgetAvailabilityProducedDTO(
                failure = "budget is not enough"
            )
      val kafkaMsg = budgetAvailabilityProducedKafkaTemplate.send(
            "budget-availability-produced",
            key,
            budgetAvailabilityProducedDTO
        ).get()
//        kafkaMsg.
        // TODO handle possibile kafka exception
    }
}

//todo la cancellazione e la creazione delle transazioni deve essere fatta con debesiium
