package it.polito.ecommerce.catalogservice.kafka.listeners

import it.polito.ecommerce.catalogservice.dto.kafkadtos.RequestDTO
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.stereotype.Component

@Component
class RequestListener {
//
//    @KafkaListener (id="catalogGroup", topics=["user-created"], containerFactory = "requestDTOContainerFactory")
//    fun listen (requestDTO: RequestDTO){
//        println ("Received ---> $requestDTO")
//    }
}