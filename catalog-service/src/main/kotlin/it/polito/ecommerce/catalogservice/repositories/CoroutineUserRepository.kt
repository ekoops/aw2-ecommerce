package it.polito.ecommerce.catalogservice.repositories

import it.polito.ecommerce.catalogservice.domain.User
import org.springframework.data.repository.kotlin.CoroutineCrudRepository

interface CoroutineUserRepository : CoroutineCrudRepository<User, Long> {
    suspend fun findByUsername(username: String): User?
    suspend fun existsByUsernameOrEmail(username: String, email: String): Boolean
}