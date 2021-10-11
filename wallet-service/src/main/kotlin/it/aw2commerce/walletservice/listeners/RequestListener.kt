package it.aw2commerce.walletservice.listeners

import com.fasterxml.jackson.core.JsonProcessingException
import com.fasterxml.jackson.module.kotlin.jacksonTypeRef
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import it.aw2commerce.walletservice.domain.Transaction
import it.aw2commerce.walletservice.domain.toTransactionDTO
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
import java.time.LocalDateTime



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
        topics = ["budget-availability-requested"],
        containerFactory = "budgetAvailabilityRequestedContainerFactory",

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
     fun listenDebezium(record: ConsumerRecord<String?, String?> , @Header(KafkaHeaders.RECEIVED_MESSAGE_KEY) key: String) {
        val consumedValue = record.value()
        val mapper = ObjectMapper()
        val jsonNode = mapper.readTree(consumedValue)

        val keyDebezium = mapper.readTree(key)
        var keyKafkaNode = keyDebezium.path("payload").path("id").textValue()
        keyKafkaNode = keyKafkaNode.replace("\\\"" , "\"")
        val oid = mapper.readTree(keyKafkaNode).path("\$oid").textValue()

        val payload: JsonNode = jsonNode.path("payload")
        val afterNode: JsonNode = payload.path("after")
        var after = mapper.readTree(afterNode.toString()).textValue()
        after = after.replace("\\\"" , "\"")
        val after2 = mapper.readTree(after)
        val itemsPath = after2.path("items")
        val items = mapper.readValue(itemsPath.toString() , jacksonTypeRef<Array<OrderItemDTO>>())
        val amount = items.fold(0.0) { acc, orderItemDTO ->
            acc + orderItemDTO.amount * orderItemDTO.perItemPrice
        }

        val buyerId = after2.path("buyerId").toString()

        val opNode: JsonNode = payload.path("op")
        val op = mapper.readTree(opNode.toString()).textValue()
        if(op == "c"){
            println("Handling creation on debezium")
            val buyerWaller = walletRepository.getWalletByCustomerId(buyerId.toLong())
            if (buyerWaller == null){
                println("Wallet is null")

                val orderApprovedByWalletDTO = OrderApprovedByWalletDTO(
                    failure = "Wallet not found"
                )

                orderCreationWalletKafkaTemplate.send(
                    "order-creation-wallet-response",
                    oid,
                    orderApprovedByWalletDTO
                ).get()
                return
            }

            val amountLoLong:Long = amount.toLong()
            val newTransaction = Transaction(
                amount = -amountLoLong * 100,
                timeInstant = LocalDateTime.now(),
                wallet = buyerWaller ,
                referenceId = oid
            )
            transactionRepository.save(newTransaction)
            val orderApprovedByWalletDTO = OrderApprovedByWalletDTO(
                ok = ApprovationDTO(
                    orderDTO = OrderDTO(
                        buyerId = buyerId.toLong(),
                        deliveryAddress = "",
                        items= listOf(),
                        )
                    )
              )
            buyerWaller.amount += newTransaction.amount
            walletRepository.save(buyerWaller)

            try{
                orderCreationWalletKafkaTemplate.send(
                    "order-creation-wallet-response",
                    oid,
                    orderApprovedByWalletDTO
                ).get()
            }catch (e:Exception){
                println("ERRORE")
                println(e.message)
            }

            return

        }else if(op == "d"){
            println("Handling delete on debezium")
            //todo handle delete debezium
            val transactions = transactionRepository.findAllByReferenceId(oid)

            if(transactions.isEmpty()){
                val orderApprovedByWalletDTO = OrderApprovedByWalletDTO(
                    ok = ApprovationDTO(
                        orderDTO = OrderDTO(
                            buyerId = buyerId.toLong(),
                            deliveryAddress = "",
                            items= listOf(),
                        )
                    )
                )
                try{
                    orderCreationWalletKafkaTemplate.send(
                        "order-creation-wallet-response",
                        oid,
                        orderApprovedByWalletDTO
                    ).get()
                }catch (e:Exception){
                    println("ERRORE")
                    println(e.message)
                }
                return
            }

            val buyerWaller = walletRepository.getWalletByCustomerId(buyerId.toLong())

            if(buyerWaller == null){
                val orderApprovedByWalletDTO = OrderApprovedByWalletDTO(
                    failure = "Wallet not found"
                )

                orderCreationWalletKafkaTemplate.send(
                    "order-creation-wallet-response",
                    oid,
                    orderApprovedByWalletDTO
                ).get()
                return

            }

            transactions.forEach {
                buyerWaller.amount += it.amount
            }

            walletRepository.save(buyerWaller)

            transactions.forEach { transactionRepository.deleteByReferenceId(it.referenceId) }

            val orderApprovedByWalletDTO = OrderApprovedByWalletDTO(
                ok = ApprovationDTO(
                    orderDTO = OrderDTO(
                        buyerId = buyerId.toLong(),
                        deliveryAddress = "",
                        items= listOf(),
                    )
                )
            )
            try{
                orderCreationWalletKafkaTemplate.send(
                    "order-creation-wallet-response",
                    oid,
                    orderApprovedByWalletDTO
                ).get()
            }catch (e:Exception){
                println("ERRORE")
                println(e.message)
            }


        }else{
            println("Operation unsupported")

            orderCreationWalletKafkaTemplate.send(
                "order-creation-wallet-response",
                oid,
                OrderApprovedByWalletDTO(
                    failure = "Operation unsupported"
                )
            ).get()
            return
        }


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
         "patch":null,
         "filter":null,
         "source":
            {"version":"1.6.2.Final",
            "connector":"mongodb",
            "name":"order-db",
            "ts_ms":1633702840000,
            "snapshot":"false",
            "db":"order-db",
            "sequence":null,
            "rs":"rs0",
            "collection":"orders",
            "ord":1,
            "h":null,"tord":null,"stxnid":"99d8bd2a-17b8-361b-9b7c-b4d0c558668c:1"},
         "op":"c",
         "ts_ms":1633702840079,
         "transaction":null}
"{\"_id\": {\"$oid\": \"616053b7a9d89155d0d181ad\"},\"status\": \"PENDING\",\"warehouseHasApproved\": false,\"walletHasApproved\": false,\"buyerId\": 1,\"deliveryAddress\": \"user1_deliveryAddress\",\"items\": [{\"productId\": \"1\",\"amount\": 140,\"perItemPrice\": 3.33,\"sources\": []}],\"createdAt\": {\"$date\": 1633702839984},\"updatedAt\": {\"$date\": 1633702839984},\"__v\": 0}"
         */
    }



    //end debezium

}

