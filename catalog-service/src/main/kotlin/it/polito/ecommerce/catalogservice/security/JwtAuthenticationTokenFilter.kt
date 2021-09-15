package it.polito.ecommerce.catalogservice.security

import org.springframework.beans.factory.annotation.Value
import org.springframework.security.authentication.AuthenticationTrustResolver
import org.springframework.security.authentication.AuthenticationTrustResolverImpl
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.authorization.AuthorizationDecision
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.ReactiveSecurityContextHolder
import org.springframework.security.core.context.SecurityContext
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.server.ServerWebExchange
import org.springframework.web.server.WebFilter
import org.springframework.web.server.WebFilterChain
import reactor.core.publisher.Mono


@Component
class JwtAuthenticationTokenFilter(
    private val jwtUtils: JwtUtils,
    @Value("\${application.jwt.jwtHeader}") private val jwtHeader: String,
    @Value("\${application.jwt.jwtHeaderStart}") private val jwtHeaderStart: String
) : WebFilter {

    override fun filter(exchange: ServerWebExchange, chain: WebFilterChain): Mono<Void> {
        val authorizationHeader= exchange.request.headers[jwtHeader]?.get(0)
        if (authorizationHeader != null) {
            val jwt = authorizationHeader.removePrefix("$jwtHeaderStart ")

            if (jwtUtils.validateJwtToken(jwt)) {
                val detailsFromJwtToken = jwtUtils.getDetailsFromJwtToken(jwt)
                print("Auth: ${detailsFromJwtToken.authorities}")
                val authentication = UsernamePasswordAuthenticationToken(
                    detailsFromJwtToken,
                    null,
                    detailsFromJwtToken.authorities
                )
                // SecurityContextHolder.getContext().authentication = authentication
                println("@@@@@ Authentication is: $authentication")
                println("@@@@@ Authorities are: ${detailsFromJwtToken.authorities}")

                ReactiveSecurityContextHolder.withSecurityContext(ReactiveSecurityContextHolder.getContext().map {
                    it.authentication = authentication
                    it
                })

                ReactiveSecurityContextHolder.withAuthentication(authentication)
            }
        }


        val c: SecurityContext? = ReactiveSecurityContextHolder
            .getContext()
            .share()
            .block()

        println("@@@@@ Security context is: $c")

        ReactiveSecurityContextHolder
            .getContext()
            .filter{c ->
                println("c.auth: ${c.authentication}")
                c.authentication != null
            }
            .map(SecurityContext::getAuthentication)
            .filter{
                println("Before: $it")
                true
            }
            .filter(this::isNotAnonymous)
            .filter{
                println("After: $it")
                true
            }
            .map(this::getAuthorizationDecision)
            .subscribe{
                println("The result is: ${it}")
            }
        return chain.filter(exchange)
    }


    private fun getAuthorizationDecision(authentication: Authentication): AuthorizationDecision {
        return AuthorizationDecision(authentication.isAuthenticated)
    }

    private fun isNotAnonymous(authentication: Authentication): Boolean {
        return !AuthenticationTrustResolverImpl().isAnonymous(authentication)
    }
}