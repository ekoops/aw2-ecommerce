package it.polito.ecommerce.catalogservice.configurations

import com.fasterxml.jackson.databind.ObjectMapper
import it.polito.ecommerce.catalogservice.exceptions.ErrorDetails
import it.polito.ecommerce.catalogservice.exceptions.ErrorType
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.DelegatingPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.security.web.server.ServerAuthenticationEntryPoint
import reactor.core.publisher.Mono

@Configuration
class SecurityConfiguration(
    private val objectMapper: ObjectMapper
) {
    @Bean
    fun passwordEncoder(): PasswordEncoder = DelegatingPasswordEncoder(
        "bcrypt",
        mapOf<String, PasswordEncoder>(
            "bcrypt" to BCryptPasswordEncoder()
        )
    )

    @Bean
    fun authenticationEntryPoint(): ServerAuthenticationEntryPoint {
        return ServerAuthenticationEntryPoint { exchange, authException ->
            exchange.response.headers.set("Content-Type", "application/json")
            exchange.response.statusCode = HttpStatus.UNAUTHORIZED
            val errorDetails = ErrorDetails(
                type = ErrorType.UNAUTHORIZED,
                title = "Unauthorized request",
                detail = authException.message
            )
            exchange.response.writeWith { Mono.just(objectMapper.writeValueAsString(errorDetails)) }
        }
    }


}