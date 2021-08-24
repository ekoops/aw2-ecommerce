package it.aw2commerce.walletservice.listeners

import it.aw2commerce.walletservice.dto.incoming.CreateWalletRequestDTO
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.stereotype.Component


@Component
class RequestListener {

//    @KafkaListener(
//        id = "walletService" ,
//        topics = ["prova"],
//        containerFactory = "createWalletRequestDTOContainerFactory"
//    )
//    fun listen(createWalletRequestDTO: CreateWalletRequestDTO){
//        //TODO
//    }

}