package it.polito.ecommerce.catalogservice.controllers

import it.polito.ecommerce.catalogservice.dto.UserDTO
import it.polito.ecommerce.catalogservice.dto.incoming.CreateUserRequestDTO
import it.polito.ecommerce.catalogservice.dto.incoming.SignInUserRequestDTO
import it.polito.ecommerce.catalogservice.security.JwtUtils
import it.polito.ecommerce.catalogservice.services.implementations.UserDetailsServiceImpl
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.security.authentication.ReactiveAuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.ReactiveSecurityContextHolder
import org.springframework.web.bind.annotation.*
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
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun signin(
        @Valid @RequestBody signInUserRequestDTO: SignInUserRequestDTO,
        response: HttpServerResponse
    ) = authenticationManager.authenticate(
        UsernamePasswordAuthenticationToken(
            signInUserRequestDTO.username,
            signInUserRequestDTO.password
        )
    ).map { authentication ->
        ReactiveSecurityContextHolder.getContext().map {
            it.authentication = authentication
            val token = jwtUtils.generateJwtToken(authentication)
            response.responseHeaders().set(jwtHeader, "$jwtHeaderStart $token")
        }
    }

    @GetMapping("/confirmRegistration")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    suspend fun confirmRegistration(
        @RequestParam("token", required = true) token: String,
    ): Unit = userDetailsService.verifyUser(token = token)


//    @GetMapping("/enableUser")
//    @ResponseStatus(HttpStatus.NO_CONTENT)
//    suspend fun enableUser(
//        @RequestParam("username", required = true) username: String,
//    ): Boolean = userDetailsService.enableUser(username)
}


