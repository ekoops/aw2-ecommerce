package it.polito.ecommerce.catalogservice.controllers

import it.polito.ecommerce.catalogservice.dto.UserDTO
import it.polito.ecommerce.catalogservice.dto.UserDetailsDTO
import it.polito.ecommerce.catalogservice.dto.incoming.CreateUserRequestDTO
import it.polito.ecommerce.catalogservice.dto.incoming.SignInUserRequestDTO
import it.polito.ecommerce.catalogservice.exceptions.security.BadAuthenticationException
import it.polito.ecommerce.catalogservice.security.JwtUtils
import it.polito.ecommerce.catalogservice.services.implementations.UserDetailsServiceImpl
import org.apache.kafka.common.requests.RequestContext
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.security.authentication.ReactiveAuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.ReactiveSecurityContextHolder
import org.springframework.web.bind.annotation.*
import org.springframework.web.context.request.RequestContextHolder
import reactor.core.publisher.Mono
import reactor.netty.http.server.HttpServerResponse
import javax.validation.Valid


@RestController
@RequestMapping("/auth")
class AuthController(
    private val userDetailsService: UserDetailsServiceImpl,
    @Value("\${application.jwt.jwtHeader}") private val jwtHeader: String,
    @Value("\${application.jwt.jwtHeaderStart}") private val jwtHeaderStart: String,
    private val authenticationManager: ReactiveAuthenticationManager,
    private val jwtUtils: JwtUtils
) {
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    suspend fun register(
        @Valid @RequestBody createUserRequestDTO: CreateUserRequestDTO
    ): UserDTO = userDetailsService.createUser(createUserRequestDTO)

    @PostMapping("/signin")
    @ResponseStatus(HttpStatus.OK)
    fun signin(
        @Valid @RequestBody signInUserRequestDTO: SignInUserRequestDTO,
        response: HttpServerResponse
    ): Mono<String> {
        return Mono.zip(
            authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken(
                    signInUserRequestDTO.username,
                    signInUserRequestDTO.password
                )
            ),
            ReactiveSecurityContextHolder.getContext()
        ).map { tuple ->
            val authentication = tuple.t1
            val securityContext = tuple.t2
            val userDetailsDTO = authentication.principal as? UserDetailsDTO ?: throw BadAuthenticationException()
            val isRoleLegitimate =
                userDetailsDTO.authorities.map { it.authority }.contains(signInUserRequestDTO.role)
            if (!isRoleLegitimate) {
                throw BadAuthenticationException()
            }
            securityContext.authentication = authentication
            val token = jwtUtils.generateJwtToken(authentication)
            response.addHeader(jwtHeader, "$jwtHeaderStart $token")
            "ciao"
        }
    }

    @GetMapping("/confirmRegistration")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    suspend fun confirmRegistration(
        @RequestParam("token", required = true) token: String,
    ): Unit = userDetailsService.verifyUser(token = token)
}


