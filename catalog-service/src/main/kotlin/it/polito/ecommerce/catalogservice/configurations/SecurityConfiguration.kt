package it.polito.ecommerce.catalogservice.configurations

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.DelegatingPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.AuthenticationEntryPoint

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
    fun authenticationEntryPoint(): AuthenticationEntryPoint {
        return AuthenticationEntryPoint { _, response, authException ->
            response.contentType = "application/json"
            response.status = HttpServletResponse.SC_UNAUTHORIZED
            val errorDetails = ErrorDetails(
                type = ErrorType.UNAUTHORIZED,
                title = "Unauthorized request",
                detail = authException.message
            )
            response.outputStream.println(objectMapper.writeValueAsString(errorDetails))
        }
    }
}