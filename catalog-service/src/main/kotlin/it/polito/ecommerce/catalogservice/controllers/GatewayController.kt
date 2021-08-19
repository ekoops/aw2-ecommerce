package it.polito.ecommerce.catalogservice.controllers

import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.GetMapping




@RestController
class GatewayController {

    @GetMapping("/defaultFallback")
    fun defaultMessage(): String? {
        return "There were some error in connecting. Please try again later."
    }
}