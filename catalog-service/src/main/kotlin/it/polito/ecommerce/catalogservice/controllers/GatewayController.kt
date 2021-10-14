package it.polito.ecommerce.catalogservice.controllers

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.reactive.function.server.ServerResponse
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono


@RestController
class GatewayController {

    @RequestMapping("/failure")
    fun failureHandler() {
        throw ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "We are sorry, the service you are trying to reach is currently unavailable. Try again later!")
    }

}