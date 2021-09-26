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

@Configuration
class DbInitConfiguration {
    @Bean
    fun commandLineRunner(
        userRepository: UserRepository,
        customerRepository: CustomerRepository,
        passwordEncoder: PasswordEncoder
    ) = CommandLineRunner {
        userRepository.findByUsername("user1").map { throw Exception() }.subscribe(
            {println("PROVA onNext")},
            {println("PROVA onError")},
            {println("PROVA onComplete")},
        )
//        user1.flatMap {
//            println("USER obtained user: $it")
//            if (it == null) {
//                val newUser = User(
//                    username = "user1",
//                    email = "user1@yopmail.com",
//                    password = passwordEncoder.encode("password"),
//                    isEnabled = true,
//                    isLocked = false,
//                    rolesList = listOf(Rolename.ADMIN, Rolename.CUSTOMER)
//                )
//                userRepository.save(newUser).flatMap { createdUser ->
//                    val customer = Customer(
//                        name = "user1_name",
//                        surname = "user1_surname",
//                        deliveryAddress = "user1_deliveryAddress",
//                        user = createdUser
//                    )
//                    customerRepository.save(customer).map { createdUser }
//                }
//            } else user1
//        }.subscribe({println("USER INFO: user1 created")}, {err -> println("USER ERR: $err")})

//        val user2 = userRepository.findByUsername("user2")
//        user2.flatMap {
//            if (it == null) {
//                val newUser = User(
//                    username = "user2",
//                    email = "user2@yopmail.com",
//                    password = passwordEncoder.encode("password"),
//                    isEnabled = true,
//                    isLocked = false,
//                    rolesList = listOf(Rolename.ADMIN)
//                )
//                userRepository.save(newUser)
//            } else user2
//        }.block()
//        println("user2 created")
//
//
//        val user3 = userRepository.findByUsername("user3")
//        user3.flatMap {
//            if (it == null) {
//                val newUser = User(
//                    username = "user3",
//                    email = "user3@yopmail.com",
//                    password = passwordEncoder.encode("password"),
//                    isEnabled = true,
//                    isLocked = false,
//                    rolesList = listOf(Rolename.CUSTOMER)
//                )
//                userRepository.save(newUser).flatMap { createdUser ->
//                    val customer = Customer(
//                        name = "user3_name",
//                        surname = "user3_surname",
//                        deliveryAddress = "user3_deliveryAddress",
//                        user = createdUser
//                    )
//                    customerRepository.save(customer).map { createdUser }
//                }
//            } else user3
//        }.block()
//        println("user3 created")

    }
}