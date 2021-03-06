package it.polito.ecommerce.catalogservice.configurations

import it.polito.ecommerce.catalogservice.domain.Rolename
import it.polito.ecommerce.catalogservice.domain.User
import it.polito.ecommerce.catalogservice.repositories.UserRepository
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.crypto.password.PasswordEncoder

@Configuration
class DbInitConfiguration(
     private val userRepository: UserRepository,
     private val passwordEncoder: PasswordEncoder) {

    @Bean
    fun commandLineRunner() = CommandLineRunner {

        val user1 = User(
            username = "user1",
            email = "user1@yopmail.com",
            password = passwordEncoder.encode("User!001"),
            isEnabled = true,
            isLocked = false,
            rolesList = listOf(Rolename.ADMIN, Rolename.CUSTOMER),
            name = "user1_name",
            surname = "user1_surname",
            deliveryAddress = "user1_deliveryAddress"
        )

        val user2 = User(
            username = "user2",
            email = "user2@yopmail.com",
            password = passwordEncoder.encode("User!002"),
            isEnabled = true,
            isLocked = false,
            rolesList = listOf(Rolename.CUSTOMER),
            name = "user2_name",
            surname = "user2_surname",
            deliveryAddress = "user2_deliveryAddress"
        )

        val user3 = User(
            username = "user3",
            email = "user3@yopmail.com",
            password = passwordEncoder.encode("User!003"),
            isEnabled = true,
            isLocked = false,
            rolesList = listOf(Rolename.CUSTOMER),
            name = "user3_name",
            surname = "user3_surname",
            deliveryAddress = "user3_deliveryAddress"
        )

        userRepository
            .findByUsername("user1")
            .switchIfEmpty(userRepository.save(user1))
            .block(
//                {
//                    println("@@@! Received item: ${it.id}")
//                },
//                {
//                    println("@@@! Received error: ${it.message}")
//                },
//                {
//                    println("@@@! Completed")
//                },
            )

        userRepository
            .findByUsername("user2")
            .switchIfEmpty(userRepository.save(user2))
            .block(
//                {
//                    println("@@@! Received item: ${it.id}")
//                },
//                {
//                    println("@@@! Received error: ${it.message}")
//                },
//                {
//                    println("@@@! Completed")
//                },
            )

        userRepository
            .findByUsername("user3")
            .switchIfEmpty(userRepository.save(user3))
            .block(
//                {
//                    println("@@@! Received item: ${it.id}")
//                },
//                {
//                    println("@@@! Received error: ${it.message}")
//                },
//                {
//                    println("@@@! Completed")
//                },
            )
    }
}