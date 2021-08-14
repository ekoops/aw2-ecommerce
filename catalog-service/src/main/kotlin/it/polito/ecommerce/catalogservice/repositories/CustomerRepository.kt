package it.polito.ecommerce.catalogservice.repositories

import it.polito.ecommerce.catalogservice.domain.Customer
import org.springframework.data.repository.kotlin.CoroutineCrudRepository
import org.springframework.stereotype.Repository

@Repository
interface CustomerRepository : CoroutineCrudRepository<Customer, Long>