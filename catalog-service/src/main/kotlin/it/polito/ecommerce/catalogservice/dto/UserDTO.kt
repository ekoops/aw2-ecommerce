package it.polito.ecommerce.catalogservice.dto

import it.polito.ecommerce.catalogservice.domain.toUserDetailsDTO

class UserDTO(
    val id: Long,
    val username: String,
    val email: String,
    val name : String,
    val surname : String,
    val deliveryAddress : String?
)
