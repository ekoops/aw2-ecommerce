package it.aw2commerce.walletservice.security

import io.jsonwebtoken.Jwts
import io.jsonwebtoken.SignatureAlgorithm
import io.jsonwebtoken.security.Keys
import it.aw2commerce.walletservice.domain.Rolename
import it.aw2commerce.walletservice.dto.UserDetailsDTO
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.time.Instant
import java.util.*


@Component
class JwtUtils constructor(
    @Value("\${application.jwt.jwtSecret}") private val jwtSecret: String,
    @Value("\${application.jwt.jwtExpirationMs}") private val jwtExpirationMs: Long,
) {
    private val key = Keys.hmacShaKeyFor(jwtSecret.toByteArray())


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