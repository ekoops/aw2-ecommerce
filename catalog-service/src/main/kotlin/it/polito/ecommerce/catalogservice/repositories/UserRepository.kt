package it.polito.ecommerce.catalogservice.repositories

import it.polito.ecommerce.catalogservice.domain.User
import kotlinx.coroutines.flow.Flow
import org.springframework.data.r2dbc.repository.Query
import org.springframework.data.repository.kotlin.CoroutineCrudRepository
import org.springframework.data.repository.reactive.ReactiveCrudRepository
import org.springframework.stereotype.Repository
import reactor.core.publisher.Mono

@Repository
interface UserRepository : CoroutineCrudRepository<User, Long> {
    fun findByUsername(username: String): User
    suspend fun existsByUsernameOrEmail(
        username: String, email: String
    ): Boolean


//    @Query("SELECT name FROM user WHERE id=:id")
//    fun findUsernameById(id:Long): Mono<String>
}