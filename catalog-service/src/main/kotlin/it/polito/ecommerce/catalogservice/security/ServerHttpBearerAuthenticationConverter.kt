package it.polito.ecommerce.catalogservice.security

import org.springframework.beans.factory.annotation.Value
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.security.web.server.authentication.ServerAuthenticationConverter
import org.springframework.stereotype.Component
import org.springframework.web.server.ServerWebExchange
import reactor.core.publisher.Mono
import java.util.function.Predicate


@Component
class ServerHttpBearerAuthenticationConverter(
    private val jwtUtils: JwtUtils,
    @Value("\${application.jwt.jwtHeader}") private val jwtHeader: String,
    @Value("\${application.jwt.jwtHeaderStart}") private val jwtHeaderStart: String
): ServerAuthenticationConverter {
    private val BEARER = "Bearer "
    private val matchBearerLength: Predicate<String> =
        Predicate<String> { authValue -> (authValue.length > BEARER.length) }

    private fun isolateBearerValue(authValue: String): Mono<String> {
        return Mono.justOrEmpty(authValue.substring(BEARER.length))
    }

    fun apply(serverWebExchange: ServerWebExchange?): Mono<Authentication> {
        return Mono.justOrEmpty(serverWebExchange)
            .flatMap {
                val authorizationHeader= it!!.request.headers[jwtHeader]?.get(0)
                if (authorizationHeader != null) {
                    val jwt = authorizationHeader.removePrefix("$jwtHeaderStart ")
                    if (jwtUtils.validateJwtToken(jwt)) {
                        val detailsFromJwtToken = jwtUtils.getDetailsFromJwtToken(jwt)
                        print("Auth: ${detailsFromJwtToken.authorities}")
                        return@flatMap Mono.just(UsernamePasswordAuthenticationToken(
                            detailsFromJwtToken,
                            null,
                            detailsFromJwtToken.authorities
                        ) as Authentication)
                    }
                }
                return@flatMap Mono.empty<Authentication>()
            }
    }

    override fun convert(exchange: ServerWebExchange?): Mono<Authentication> {
        return apply(exchange)
    }

}