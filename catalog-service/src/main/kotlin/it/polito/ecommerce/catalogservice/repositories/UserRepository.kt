package it.polito.ecommerce.catalogservice.repositories

import it.polito.ecommerce.catalogservice.domain.User
import org.springframework.data.r2dbc.repository.Query
import org.springframework.data.repository.reactive.ReactiveCrudRepository
import org.springframework.stereotype.Repository
import reactor.core.publisher.Mono

@Repository
interface UserRepository : ReactiveCrudRepository<User, Long> {
    fun findByUsername(username: String): Mono<User>
    fun existsByUsernameOrEmail(
        username: String,
        email: String
    ): Mono<Boolean>


//    @Query("SELECT name FROM user WHERE id=:id")
//    fun findUsernameById(id:Long): Mono<String>
}