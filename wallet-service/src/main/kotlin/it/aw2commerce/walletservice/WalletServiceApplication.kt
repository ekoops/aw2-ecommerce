package it.aw2commerce.walletservice

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication



@SpringBootApplication
//@EnableEurekaClient
class WalletServiceApplication

fun main(args: Array<String>) {
    runApplication<WalletServiceApplication>(*args)

    //todo devo mettere spring security
    //TODO devo accettare richieste solo dall'interno
}
