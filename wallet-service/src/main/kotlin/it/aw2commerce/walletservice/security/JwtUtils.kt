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
) {
    fun getDetailsFromJwtToken(authToken: String): UserDetailsDTO {
        val i = authToken.lastIndexOf('.')
        val withoutSignature = authToken.substring(0, i+1);
        val claims = Jwts
            .parserBuilder()
            .build()
            .parseClaimsJwt(withoutSignature).body;

        return UserDetailsDTO(
            id = claims["id"].toString().toLong(),
            username = claims["username"].toString(),
            email = claims["email"].toString(),
            role =  Rolename.valueOf(claims["role"].toString() ),
            isEnabled = true,
            name = claims["name"].toString(),
            surname = claims["surname"].toString(),
            deliveryAddress = claims["deliveryAddress"].toString()
        )
    }
}