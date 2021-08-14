package it.polito.ecommerce.catalogservice.services

import it.polito.ecommerce.catalogservice.dto.EmailVerificationTokenDTO

interface NotificationService {
    suspend fun createEmailVerificationToken(username: String): EmailVerificationTokenDTO
    suspend fun getEmailVerificationToken(token: String): EmailVerificationTokenDTO
    suspend fun removeEmailVerificationToken(token: String): Long
    suspend fun removeAllExpiredEmailVerificationToken(): Long
}