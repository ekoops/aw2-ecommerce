package it.polito.ecommerce.catalogservice.repositories

import it.polito.ecommerce.catalogservice.domain.EmailVerificationToken
import org.springframework.data.repository.kotlin.CoroutineCrudRepository
import org.springframework.data.repository.reactive.ReactiveCrudRepository
import reactor.core.publisher.Mono
import java.time.LocalDateTime

interface EmailVerificationTokenRepository: CoroutineCrudRepository<EmailVerificationToken,Long> {
    suspend fun findByToken(token: String): EmailVerificationToken
    suspend fun deleteByToken(token: String): Long
    suspend fun deleteByExpirationDateBefore(date: LocalDateTime): Long
}