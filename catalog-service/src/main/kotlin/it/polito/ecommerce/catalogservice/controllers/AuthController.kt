package it.polito.ecommerce.catalogservice.controllers

import it.polito.ecommerce.catalogservice.dto.UserDTO
import it.polito.ecommerce.catalogservice.dto.UserDetailsDTO
import it.polito.ecommerce.catalogservice.dto.incoming.CreateUserRequestDTO
import it.polito.ecommerce.catalogservice.dto.incoming.SignInUserRequestDTO
import it.polito.ecommerce.catalogservice.exceptions.security.BadAuthenticationException
import it.polito.ecommerce.catalogservice.security.JwtUtils
import it.polito.ecommerce.catalogservice.services.implementations.UserDetailsServiceImpl
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.ReactiveAuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ServerWebExchange
import reactor.core.publisher.Mono
import javax.validation.Valid
import org.springframework.security.core.context.SecurityContextImpl
import org.springframework.security.web.server.context.ServerSecurityContextRepository
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.PostMapping


@RestController
@RequestMapping("/auth")
class AuthController(
    private val userDetailsService: UserDetailsServiceImpl,
    @Value("\${application.jwt.jwtHeader}") private val jwtHeader: String,
    @Value("\${application.jwt.jwtHeaderStart}") private val jwtHeaderStart: String,
    private val authenticationManager: ReactiveAuthenticationManager,
    private val jwtUtils: JwtUtils,
    private val securityContextRepository: ServerSecurityContextRepository
) {
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    suspend fun register(
        @Valid @RequestBody createUserRequestDTO: CreateUserRequestDTO
    ): UserDTO = userDetailsService.createUser(createUserRequestDTO)

    @PostMapping("/signin")
    fun signin(
        @Valid @RequestBody signInUserRequestDTO: SignInUserRequestDTO,
        exchange: ServerWebExchange
    ): Mono<ResponseEntity<Void>> {
        return authenticationManager.authenticate(
            UsernamePasswordAuthenticationToken(
                signInUserRequestDTO.username,
                signInUserRequestDTO.password
            )
        )
        .map{ authentication ->
            if (authentication == null) {
                throw BadAuthenticationException()
            }
            val securityContext = SecurityContextImpl(authentication)
            val userDetailsDTO = authentication.principal as? UserDetailsDTO ?: throw BadAuthenticationException()
            val isRoleLegitimate =
                userDetailsDTO.authorities.map { it.authority }.contains(signInUserRequestDTO.role)
            println(">>>>>> isRoleLeggitimate: $isRoleLegitimate")
            if (!isRoleLegitimate) {
                println(">>>>> role is not legitimate")
                throw BadAuthenticationException()
            }
            securityContext.authentication = authentication
            val token = jwtUtils.generateJwtToken(authentication, signInUserRequestDTO.role)
            ResponseEntity.noContent()
                .header(jwtHeader, "$jwtHeaderStart $token").build<Void>()
            }
            .doOnError { err: Throwable -> println(err.message) }
    }


    @GetMapping("/confirmRegistration")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    suspend fun confirmRegistration(
        @RequestParam("token", required = true) token: String,
    ): Unit = userDetailsService.verifyUser(token = token)

}


