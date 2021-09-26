package it.polito.ecommerce.catalogservice.configurations

import it.polito.ecommerce.catalogservice.domain.Customer
import it.polito.ecommerce.catalogservice.domain.Rolename
import it.polito.ecommerce.catalogservice.domain.User
import it.polito.ecommerce.catalogservice.repositories.CoroutineCustomerRepository
import it.polito.ecommerce.catalogservice.repositories.CoroutineUserRepository
import it.polito.ecommerce.catalogservice.repositories.CustomerRepository
import it.polito.ecommerce.catalogservice.repositories.UserRepository
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.crypto.password.PasswordEncoder
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@Configuration
class DbInitConfiguration(
     private val userRepository: UserRepository,
     private val customerRepository: CustomerRepository,
     private val passwordEncoder: PasswordEncoder) {
    final val user1 = User(
        username = "user1",
        email = "user1@yopmail.com",
        password = passwordEncoder.encode("password"),
        isEnabled = true,
        isLocked = false,
        rolesList = listOf(Rolename.ADMIN, Rolename.CUSTOMER)
    )

    final val user2 = User(
        username = "user2",
        email = "user2@yopmail.com",
        password = passwordEncoder.encode("password"),
        isEnabled = true,
        isLocked = false,
        rolesList = listOf(Rolename.ADMIN)
    )

    final val user3 = User(
        username = "user3",
        email = "user3@yopmail.com",
        password = passwordEncoder.encode("password"),
        isEnabled = true,
        isLocked = false,
        rolesList = listOf(Rolename.CUSTOMER)
    )

    val map = mapOf<String, User>(
        "user1" to user1,
        "user2" to user2,
        "user3" to user3
    )

    @Bean
    fun commandLineRunner() = CommandLineRunner {
        println("@@@@@ DbInitConfiguration Started!! v3 @@@@@")


        userRepository
            .findByUsername("user1")
            .switchIfEmpty(userRepository.save(map[it.]!!))
            .flatMap {
                val customer = Customer(
                    name = "user1_name",
                    surname = "user1_surname",
                    deliveryAddress = "user1_deliveryAddress",
                    user = it
                )
                return@flatMap customerRepository.save(customer)
            }
            .subscribe(
                {
                    println("@@@! Received item: ${it.id}")
                },
                {
                    println("@@@! Received error: ${it.message}")
                },
                {
                    println("@@@! Completed")
                },
            )
    }
}