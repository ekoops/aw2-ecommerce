package it.polito.ecommerce.catalogservice.services.implementations

import it.polito.ecommerce.catalogservice.domain.EmailVerificationToken
import it.polito.ecommerce.catalogservice.domain.toEmailVerificationTokenDTO
import it.polito.ecommerce.catalogservice.dto.EmailVerificationTokenDTO
import it.polito.ecommerce.catalogservice.exceptions.user.emailverificationtoken.EmailVerificationTokenNotFoundException
import it.polito.ecommerce.catalogservice.repositories.CoroutineUserRepository
import it.polito.ecommerce.catalogservice.repositories.EmailVerificationTokenRepository
import it.polito.ecommerce.catalogservice.services.NotificationService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class NotificationServiceImpl(
    private val coroutineUserRepository: CoroutineUserRepository,
    private val emailVerificationTokenRepository: EmailVerificationTokenRepository
) : NotificationService {
    override suspend fun createEmailVerificationToken(username: String): EmailVerificationTokenDTO {
        val user = coroutineUserRepository.findByUsername(username)
            ?: throw UsernameNotFoundException("User($username) not found")
        val emailVerificationToken = EmailVerificationToken(
            user = user
        )
        return emailVerificationTokenRepository.save(emailVerificationToken)
            .toEmailVerificationTokenDTO()
    }

    override suspend fun getEmailVerificationToken(token: String): EmailVerificationTokenDTO {
        val emailVerificationToken = emailVerificationTokenRepository.findByToken(
            token = token
        )
        return emailVerificationToken?.toEmailVerificationTokenDTO()
            ?: throw EmailVerificationTokenNotFoundException(token = token)
    }

    override suspend fun removeEmailVerificationToken(token: String): Long
            = emailVerificationTokenRepository.deleteByToken(token)

    override suspend fun removeAllExpiredEmailVerificationToken(): Long
            = emailVerificationTokenRepository.deleteByExpirationDateBefore(LocalDateTime.now())
}