package it.polito.ecommerce.catalogservice.controllers

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.reactive.function.server.ServerResponse
import reactor.core.publisher.Mono


@RestController
class GatewayController {

//    @GetMapping("/defaultFallback")
//    fun defaultMessage(): String? {
//        return "There were some error in connecting. Please try again later."
//    }

    @GetMapping("/defaultFallback")
    fun handleGetFallback(): Mono<ServerResponse> {
        return ServerResponse.ok().body(Mono.empty(), String.javaClass)
    }

    @PostMapping("/defaultFallback")
    fun handlePostFallback(): Mono<ServerResponse> {
        return ServerResponse.status(HttpStatus.SERVICE_UNAVAILABLE).build()
    }
}