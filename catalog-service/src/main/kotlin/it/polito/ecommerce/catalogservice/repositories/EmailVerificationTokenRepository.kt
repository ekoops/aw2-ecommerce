package it.polito.ecommerce.catalogservice.repositories

import it.polito.ecommerce.catalogservice.domain.EmailVerificationToken
import org.springframework.data.r2dbc.repository.Query
import org.springframework.data.repository.kotlin.CoroutineCrudRepository
import org.springframework.data.repository.reactive.ReactiveCrudRepository
import reactor.core.publisher.Mono
import java.time.LocalDateTime

interface EmailVerificationTokenRepository: CoroutineCrudRepository<EmailVerificationToken,Long> {

    @Query("SELECT e.id AS id , u.username AS username , u.email AS  email , u.password AS password , " +
            "u.is_enabled AS is_enabled , u.is_locked AS is_locked , u.roles AS roles , " +
            "u.name AS name, u.surname AS surname, u.delivery_address AS delivery_address , " +
            "e.expiration_date AS expiration_date , e.token AS token FROM email_verification_token e, " +
            "user u WHERE e.id=u.id AND e.token=:token")
    suspend fun findByToken(token: String): EmailVerificationToken?
    suspend fun deleteByToken(token: String): Long
    suspend fun deleteByExpirationDateBefore(date: LocalDateTime): Long
}