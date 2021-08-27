package it.aw2commerce.walletservice.listeners

import it.aw2commerce.walletservice.domain.Transaction
import it.aw2commerce.walletservice.dto.incoming.CreateWalletRequestDTO
import it.aw2commerce.walletservice.dto.kafka.BudgetAvailabilityProducedDTO
import it.aw2commerce.walletservice.dto.kafka.OrderApprovedByWalletDTO
import it.aw2commerce.walletservice.dto.kafka.OrderDTO
import it.aw2commerce.walletservice.repositories.WalletRepository
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Component


@Component
class RequestListener(
    private val budgetAvailabilityProducedKafkaTemplate: KafkaTemplate<String, BudgetAvailabilityProducedDTO>,
    private val orderApprovedByWalletKafkaTemplate: KafkaTemplate<String, OrderApprovedByWalletDTO>,
    private val walletRepository: WalletRepository
) {

    @KafkaListener(
        id = "wallet-svc-grp",
        topics = ["budget-availability-requested"],
        containerFactory = "budgetAvailabilityRequestedContainerFactory",

        )
    fun listenBudgetAvailabilityRequested(key: String, orderDTO: OrderDTO) {
        val amount = orderDTO.items.fold(0.0) { acc, orderItemDTO ->
            acc + orderItemDTO.amount * orderItemDTO.perItemPrice
        }
        // check budget availability
        //  this.walletRepository...
        val isBudgetAvailable = true // TODO mocked
        val budgetAvailabilityProducedDTO = if (isBudgetAvailable)
            BudgetAvailabilityProducedDTO(
                ok = orderDTO
            ) else
            BudgetAvailabilityProducedDTO(
                failure = "no budget" // TODO: change error description
            )
        budgetAvailabilityProducedKafkaTemplate.send(
            "budget-availability-produced",
            key,
            budgetAvailabilityProducedDTO
        ).get()
        // TODO handle possibile kafka exception
    }

    @KafkaListener(
        id = "wallet-svc-grp",
        topics = ["order-approved"],
        containerFactory = "orderApprovedContainerFactory"
    )
    fun listenOrderApproved(key: String, orderDTO: OrderDTO) {
        //TODO
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
        val amount = orderDTO.items.fold(0.0) { acc, orderItemDTO ->
            acc + orderItemDTO.amount * orderItemDTO.perItemPrice
        }
//        val transaction = Transaction(
//            purchasingWallet = wallet,
//            rechargingWallet = wallet, // TODO who has to be recharged???,
//            amount = (amount*100).toLong(),
//            timeInstant = // TODO???,
//        )
//        this.walletRepository...
    }

    @KafkaListener(
        id = "wallet-svc-grp",
        topics = ["order-cancelled"],
        containerFactory = "orderCancelledContainerFactory"
    )
    fun listenOrderCancelled(orderDTO: OrderDTO) {
        //TODO
    }

}