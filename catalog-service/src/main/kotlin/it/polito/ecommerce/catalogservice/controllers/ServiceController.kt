package it.polito.ecommerce.catalogservice.controllers

import it.polito.ecommerce.catalogservice.security.JwtUtils
import it.polito.ecommerce.catalogservice.services.implementations.UserDetailsServiceImpl
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.authentication.ReactiveAuthenticationManager
import org.springframework.security.web.server.context.ServerSecurityContextRepository
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/service")
class ServiceController(
    private val userDetailsService: UserDetailsServiceImpl,
){
    @GetMapping("/{userId}/email")
    suspend fun retrieveEmailAddress(
        @PathVariable("userId") userId: Long
    ):String? {
        return userDetailsService.retrieveEmailAddress(userId)
    }
}