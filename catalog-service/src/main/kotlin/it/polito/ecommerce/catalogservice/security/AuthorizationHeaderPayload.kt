package it.polito.ecommerce.catalogservice.security

import org.springframework.http.HttpHeaders
import org.springframework.web.server.ServerWebExchange
import reactor.core.publisher.Mono


class AuthorizationHeaderPayload {
    fun extract(serverWebExchange: ServerWebExchange): Mono<String?>? {
        return Mono.justOrEmpty(
            serverWebExchange.request
                .headers
                .getFirst(HttpHeaders.AUTHORIZATION)
        )
    }
}