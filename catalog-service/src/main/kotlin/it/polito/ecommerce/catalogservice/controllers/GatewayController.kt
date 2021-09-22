package it.polito.ecommerce.catalogservice.controllers

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.reactive.function.server.ServerResponse
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono


@RestController
class GatewayController {

//    @GetMapping("/defaultFallback")
//    fun defaultMessage(): String? {
//        return "There were some error in connecting. Please try again later."
//    }

//    @GetMapping("/defaultFallback")
//    fun handleGetFallback(): Mono<ServerResponse> {
//        return ServerResponse.ok().body(Mono.empty(), String::class.java)
//    }
//
//    @PostMapping("/defaultFallback")
//    fun handlePostFallback(): Mono<ServerResponse> {
//        return ServerResponse.status(HttpStatus.SERVICE_UNAVAILABLE).build()
//    }

    //TODO: gestire meglio il lancio delle eccezioni
    @GetMapping("/failureOrder")
    fun failureOrderGet() {
        throw ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "We are sorry, the Order Service you are trying to reach is currently unavailable. Try again later!")
    }

    @PostMapping("/failureOrder")
    fun failureOrderPost() {
        throw ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "We are sorry, the Order Service you are trying to reach is currently unavailable. Try again later!")
    }

    @GetMapping("/failureWarehouse")
    fun failureWarehouseGet() {
        throw ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "We are sorry, the Warehouse Service you are trying to reach is currently unavailable. Try again later!")
    }

    @PostMapping("/failureWarehouse")
    fun failureWarehousePost() {
        throw ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "We are sorry, the Warehouse Service you are trying to reach is currently unavailable. Try again later!")
    }

    @GetMapping("/failureWallet")
    fun failureWalletGet() {
        throw ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "We are sorry, the Wallet Service you are trying to reach is currently unavailable. Try again later!")
    }

    @PostMapping("/failureWallet")
    fun failureWalletPost() {
        throw ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "We are sorry, the Wallet Service you are trying to reach is currently unavailable. Try again later!")
    }
}