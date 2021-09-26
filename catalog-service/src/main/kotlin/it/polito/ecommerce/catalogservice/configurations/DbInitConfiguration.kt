package it.polito.ecommerce.catalogservice.configurations

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

    @Bean
    fun commandLineRunner() = CommandLineRunner {
        println("@@@@@ DbInitConfiguration Started!! v3 @@@@@")

        val user1 = User(
            username = "user1",
            email = "user1@yopmail.com",
            password = passwordEncoder.encode("password"),
            isEnabled = true,
            isLocked = false,
            rolesList = listOf(Rolename.ADMIN, Rolename.CUSTOMER)
        )

        val user2 = User(
            username = "user2",
            email = "user2@yopmail.com",
            password = passwordEncoder.encode("password"),
            isEnabled = true,
            isLocked = false,
            rolesList = listOf(Rolename.ADMIN)
        )

        val user3 = User(
            username = "user3",
            email = "user3@yopmail.com",
            password = passwordEncoder.encode("password"),
            isEnabled = true,
            isLocked = false,
            rolesList = listOf(Rolename.CUSTOMER)
        )

        userRepository
            .findByUsername("user1")
            .switchIfEmpty(userRepository.save(user1))
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

        userRepository
            .findByUsername("user2")
            .switchIfEmpty(userRepository.save(user2))
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

        userRepository
            .findByUsername("user3")
            .switchIfEmpty(userRepository.save(user3))
            .flatMap {
                val customer = Customer(
                    name = "user3_name",
                    surname = "user3_surname",
                    deliveryAddress = "user3_deliveryAddress",
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