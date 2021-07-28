package it.polito.ecommerce.catalogservice.repositories

import it.polito.ecommerce.catalogservice.domain.EmailVerificationToken
import org.springframework.data.repository.reactive.ReactiveCrudRepository
import reactor.core.publisher.Mono
import java.time.LocalDateTime

interface EmailVerificationTokenRepository: ReactiveCrudRepository<EmailVerificationToken,Long> {
    fun findByToken(token: String): Mono<EmailVerificationToken>
    fun deleteByToken(token: String): Mono<Long>
    fun deleteByExpirationDateBefore(date: LocalDateTime): Mono<Long>
}