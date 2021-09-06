package it.polito.ecommerce.catalogservice.security

import org.springframework.beans.factory.annotation.Value
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.ReactiveSecurityContextHolder
import org.springframework.security.core.context.SecurityContextImpl
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
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
                val authentication = UsernamePasswordAuthenticationToken(
                    detailsFromJwtToken,
                    null,
                    detailsFromJwtToken.authorities
                )
                val securityContext = SecurityContextImpl(authentication)
                securityContext.authentication = authentication
                //TODO: la seguente riga a cosa serve?
//                authentication.details = WebAuthenticationDetailsSource().buildDetails(request)
            }
        }
        return chain.filter(exchange)
    }



//    override fun doFilterInternal(
//        request: HttpServletRequest,
//        response: HttpServletResponse,
//        filterChain: FilterChain
//    ) {
//        val authorizationHeader: String? = request.getHeader(jwtHeader)
//        if (authorizationHeader != null) {
//            val jwt = authorizationHeader.removePrefix("$jwtHeaderStart ")
//            if (jwtUtils.validateJwtToken(jwt)) {
//                val detailsFromJwtToken = jwtUtils.getDetailsFromJwtToken(jwt)
//                val authentication = UsernamePasswordAuthenticationToken(
//                    detailsFromJwtToken,
//                    null,
//                    detailsFromJwtToken.authorities
//                )
//                authentication.details = WebAuthenticationDetailsSource()
//                    .buildDetails(request)
//                SecurityContextHolder.getContext().authentication = authentication
//            }
//        }
//
//        filterChain.doFilter(request, response)
//    }
}