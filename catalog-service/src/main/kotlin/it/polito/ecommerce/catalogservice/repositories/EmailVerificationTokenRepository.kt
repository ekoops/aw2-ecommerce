package it.polito.ecommerce.catalogservice.repositories

import it.polito.ecommerce.catalogservice.domain.EmailVerificationToken
import org.springframework.data.r2dbc.repository.Query
import org.springframework.data.repository.kotlin.CoroutineCrudRepository
import org.springframework.data.repository.reactive.ReactiveCrudRepository
import reactor.core.publisher.Mono
import java.time.LocalDateTime

interface EmailVerificationTokenRepository: CoroutineCrudRepository<EmailVerificationToken,Long> {

    @Query("SELECT * FROM email_verification_token e, user u WHERE e.id=u.id AND e.token=:token")
    suspend fun findByToken(token: String): EmailVerificationToken?
    suspend fun deleteByToken(token: String): Long
    suspend fun deleteByExpirationDateBefore(date: LocalDateTime): Long
}