package it.aw2commerce.walletservice.security

import org.springframework.beans.factory.annotation.Value
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import javax.servlet.FilterChain
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse


@Component
class JwtAuthenticationTokenFilter(
    private val jwtUtils: JwtUtils,
    @Value("\${application.jwt.jwtHeader}") private val jwtHeader: String,
    @Value("\${application.jwt.jwtHeaderStart}") private val jwtHeaderStart: String
) : OncePerRequestFilter() {
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val authorizationHeader: String? = request.getHeader(jwtHeader)
        if (authorizationHeader != null) {
            val jwt = authorizationHeader.removePrefix("$jwtHeaderStart ")
            if (jwtUtils.validateJwtToken(jwt)) {
                val detailsFromJwtToken = jwtUtils.getDetailsFromJwtToken(jwt)
                val authentication = UsernamePasswordAuthenticationToken(
                    detailsFromJwtToken,
                    null,
                    detailsFromJwtToken.authorities
                )
                authentication.details = WebAuthenticationDetailsSource()
                    .buildDetails(request)
                SecurityContextHolder.getContext().authentication = authentication
            }
        }

        filterChain.doFilter(request, response)
    }
}