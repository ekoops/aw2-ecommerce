package it.aw2commerce.walletservice.listeners

import com.fasterxml.jackson.core.JsonProcessingException
import com.fasterxml.jackson.module.kotlin.jacksonTypeRef
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import it.aw2commerce.walletservice.dto.debezium.KeyDebeziumDTO
import it.aw2commerce.walletservice.dto.kafka.*
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
    private val orderCreationWalletKafkaTemplate: KafkaTemplate<String, OrderApprovedByWalletDTO>,
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
        // check budget availability
        val wallet = this.walletRepository.getWalletByCustomerId(orderDTO.buyerId)
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
        // TODO handle possibile kafka exception
    }

    //Debezium

    @KafkaListener(
        id = "wallet-svc-grp-2",
        topics = ["order-db.order-db.orders"],
        containerFactory = "orderDBContainerFactory",
    )
    @Throws(JsonProcessingException::class)
     fun listenDebezium(record: ConsumerRecord<String?, String?> , @Header(KafkaHeaders.RECEIVED_MESSAGE_KEY) key: String) {
        val consumedValue = record.value()
        val mapper = ObjectMapper()
        val jsonNode = mapper.readTree(consumedValue)
        val keyDebezium = mapper.readTree(key)
        var keyKafkaNode = keyDebezium.path("payload").path("id").textValue()
        keyKafkaNode = keyKafkaNode.replace("\\\"" , "\"")
        val oid = mapper.readTree(keyKafkaNode).path("\$oid").textValue()
        println("@@@@@@@@@@ "+ oid )
        val payload: JsonNode = jsonNode.path("payload")
        println(payload)
        val afterNode: JsonNode = payload.path("after")
        println("AAAAAAAAAAAA" +  afterNode)
        var after = mapper.readTree(afterNode.toString()).textValue()
        after = after.replace("\\\"" , "\"")
        println("bbbbbbb" + after )
        val after2 = mapper.readTree(after)
        println("b2b2b2b2b2b" + after2)
        val itemsPath = after2.path("items")
        println("cccccccc" + itemsPath)
        val items = mapper.readValue(itemsPath.toString() , jacksonTypeRef<Array<OrderItemDTO>>())
        println(payload)
        println("AAAAAAAAAAAA")
        println(items)
        var amount = 0.0
        for (i in items){
            amount+= i.amount*i.perItemPrice
            println(i)}
        println("BBBBBBBBBBBcccccB" + amount)
        val amount2 = items.fold(0.0) { acc, orderItemDTO ->
            acc + orderItemDTO.amount * orderItemDTO.perItemPrice
        }
        println("BBBBBBBBBBBcccccB" + amount2)

        //todo leggere se l'evento è di crezione o delete
        /*
        PAYLOAD

        {"after":"
            {\"_id\":
                {\"$oid\": \"616053b7a9d89155d0d181ad\"},
            \"status\": \"PENDING\",
            \"warehouseHasApproved\": false,
            \"walletHasApproved\": false,
            \"buyerId\": 1,
            \"deliveryAddress\":
            \"user1_deliveryAddress\",
            \"items\": [{\"productId\": \"1\",\"amount\": 140,\"perItemPrice\": 3.33,\"sources\": []}],
            \"createdAt\": {\"$date\": 1633702839984},
            \"updatedAt\": {\"$date\": 1633702839984},
            \"__v\": 0}",
         "patch":null,"filter":null,"source":{"version":"1.6.2.Final","connector":"mongodb","name":"order-db","ts_ms":1633702840000,"snapshot":"false","db":"order-db","sequence":null,"rs":"rs0","collection":"orders","ord":1,"h":null,"tord":null,"stxnid":"99d8bd2a-17b8-361b-9b7c-b4d0c558668c:1"},"op":"c","ts_ms":1633702840079,"transaction":null}
"{\"_id\": {\"$oid\": \"616053b7a9d89155d0d181ad\"},\"status\": \"PENDING\",\"warehouseHasApproved\": false,\"walletHasApproved\": false,\"buyerId\": 1,\"deliveryAddress\": \"user1_deliveryAddress\",\"items\": [{\"productId\": \"1\",\"amount\": 140,\"perItemPrice\": 3.33,\"sources\": []}],\"createdAt\": {\"$date\": 1633702839984},\"updatedAt\": {\"$date\": 1633702839984},\"__v\": 0}"
         */

        val orderApprovedByWalletDTO = OrderApprovedByWalletDTO(
            ok = ApprovationDTO(
                orderDTO = OrderDTO(
                    buyerId = 1,
                    deliveryAddress = "via ",
                    items= listOf(),

                    )
            )
        )
        orderCreationWalletKafkaTemplate.send(
            "order-creation-wallet-response",
            oid,
            orderApprovedByWalletDTO
        ).get()
        System.exit(0)
    }


    //end debezium

}

