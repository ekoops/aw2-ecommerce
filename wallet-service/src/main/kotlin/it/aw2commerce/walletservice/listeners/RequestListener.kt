package it.aw2commerce.walletservice.listeners

import com.fasterxml.jackson.core.JsonProcessingException
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import it.aw2commerce.walletservice.dto.debezium.KeyDebeziumDTO
import it.aw2commerce.walletservice.dto.kafka.BudgetAvailabilityProducedDTO
import it.aw2commerce.walletservice.dto.kafka.OrderApprovedByWalletDTO
import it.aw2commerce.walletservice.dto.kafka.OrderDTO
import it.aw2commerce.walletservice.repositories.TransactionRepository
import it.aw2commerce.walletservice.repositories.WalletRepository
import org.apache.kafka.clients.consumer.ConsumerRecord
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.kafka.support.KafkaHeaders
import org.springframework.messaging.handler.annotation.Header
import org.springframework.stereotype.Component


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
    fun listenBudgetAvailabilityRequested(orderDTO: OrderDTO, @Header(KafkaHeaders.RECEIVED_MESSAGE_KEY) key:String) {
        val amount = orderDTO.items.fold(0.0) { acc, orderItemDTO ->
            acc + orderItemDTO.amount * orderItemDTO.perItemPrice
        }
        println("This is the key: $key")
        // check budget availability
        println("amount required= $amount")
        println("Getting wallet...")
        val wallet = this.walletRepository.getWalletByCustomerId(orderDTO.buyerId)
        println("Retrived wallet")
        if (wallet == null ) {
            println("Wallet is null")
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
        println("Getting budget...")
        val budget:Long? = wallet.getId()?.let { walletRepository.findById(it).get().amount }
        println("budget= $budget")

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
        println("Budget is enought: $isBudgetAvailable")
        val budgetAvailabilityProducedDTO = if (isBudgetAvailable)
            BudgetAvailabilityProducedDTO(
                ok = orderDTO
            ) else
            BudgetAvailabilityProducedDTO(
                failure = "Budget is not enough"
            )
        budgetAvailabilityProducedKafkaTemplate.send(
            "budget-availability-produced",
            key,
            budgetAvailabilityProducedDTO
        ).get()
//        kafkaMsg.
        // TODO handle possibile kafka exception
    }

    //Debezium

    @KafkaListener(
        id = "wallet-svc-grp-2",
        topics = ["order-db.order-db.orders"],
        containerFactory = "orderDBContainerFactory",
    )
//    fun listenDebezium(debeziumOrderDTO: DebeziumOrderDTO, @Header(KafkaHeaders.RECEIVED_MESSAGE_KEY) key:KeyDebeziumDTO) {
//
//        println("---------WE---------")
//        println(key.payload.id)
//    }
    @Throws(JsonProcessingException::class)
     fun listenDebezium(record: ConsumerRecord<String?, String?> , @Header(KafkaHeaders.RECEIVED_MESSAGE_KEY) key: String) {
        val consumedValue = record.value()
        val mapper = ObjectMapper()
        val jsonNode = mapper.readTree(consumedValue)
        val keyDebezium = mapper.readTree(key)
        println("KEY-----" + key)
        println("record.key" + record.key())
        println("record.headers" + record.headers())
        println("lunghezza" + record.headers().toArray().size)
        var keyKafkaNode = keyDebezium.path("payload").path("id").textValue()
        keyKafkaNode = keyKafkaNode.replace("\\\"" , "\"")
        println("KEYKAFKANODE:::" + keyKafkaNode)
        val oid = mapper.readTree(keyKafkaNode).path("\$oid").textValue()
        println("@@@@@@@@@@ "+ oid )
        val payload: JsonNode = jsonNode.path("payload")
        val after: JsonNode = payload.path("after")
        val userString: String = after.toString()
        println("-----------------------")
        println("PAYLOAD   $payload")
        println(userString)

        val orderApprovedByWalletDTO = OrderApprovedByWalletDTO(
            failure = "budget is null"
        )
        orderApprovedByWalletKafkaTemplate.send(
            "order-creation-wallet-response",
            key,
            orderApprovedByWalletDTO
        ).get()
        return
    }


    //end debezium

}

//todo la cancellazione e la creazione delle transazioni deve essere fatta con debesiium
