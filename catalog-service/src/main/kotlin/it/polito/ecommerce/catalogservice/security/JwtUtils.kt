package it.polito.ecommerce.catalogservice.security

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.util.*
import io.jsonwebtoken.*
import io.jsonwebtoken.security.Keys
import it.polito.ecommerce.catalogservice.domain.Rolename
import it.polito.ecommerce.catalogservice.dto.UserDetailsDTO
import it.polito.ecommerce.catalogservice.exceptions.security.BadAuthenticationException
import org.springframework.security.core.Authentication
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneOffset

@Component
class JwtUtils constructor(
    @Value("\${application.jwt.jwtSecret}") private val jwtSecret: String,
    @Value("\${application.jwt.jwtExpirationMs}") private val jwtExpirationMs: Long,
) {
    private val key = Keys.hmacShaKeyFor(jwtSecret.toByteArray())

    fun generateJwtToken(authentication: Authentication): String {
        val userDetailsDTO = authentication.principal as? UserDetailsDTO ?: throw BadAuthenticationException()
        val issuedAt = Date.from(Instant.now())
        val expirationDate = Date.from(Instant.now().plusSeconds(jwtExpirationMs / 1000))
        val builder = Jwts.builder()
            .setIssuer("Sauce Overflow")
            .setIssuedAt(issuedAt)
            .setExpiration(expirationDate)
            .claim("email", userDetailsDTO.getEmail())
            .claim("id", userDetailsDTO.getId())
            .claim("username", userDetailsDTO.username)
            .claim("roles", userDetailsDTO.authorities.joinToString(",") { it.authority })
            .signWith(key, SignatureAlgorithm.HS256)

        return builder.compact()
    }

    fun validateJwtToken(authToken: String) = try {
        Jwts
            .parserBuilder()
            .setSigningKey(key)
            .build()
            .parseClaimsJws(authToken)

        true
    } catch (e: Exception) {
        e.printStackTrace()
        false
    }

    fun getDetailsFromJwtToken(authToken: String): UserDetailsDTO {
        val claims = Jwts
            .parserBuilder()
            .setSigningKey(key)
            .build()
            .parseClaimsJws(authToken).body

        return UserDetailsDTO(
            id = claims["id"].toString().toLong(),
            username = claims["username"].toString(),
            email = claims["email"].toString(),
            roles = claims["roles"].toString().split(",").map { Rolename.valueOf(it) }.toSet(),
            isEnabled = true
        )
    }
}

