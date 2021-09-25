package it.polito.ecommerce.catalogservice.domain

import it.polito.ecommerce.catalogservice.dto.kafkadtos.UserCreatedCustomerInfoDTO
import org.springframework.data.annotation.Id
import javax.validation.constraints.NotEmpty
import javax.validation.constraints.NotNull

data class Customer(

    @Id
    val id: Long? = null,

    @field:NotNull(message = "A name must be specified")
    @field:NotEmpty(message = "The name field must be not empty")
    val name: String,

    @field:NotNull(message = "A name must be specified")
    @field:NotEmpty(message = "The name field must be not empty")
    val surname: String,

    @field:NotNull(message = "A name must be specified")
    @field:NotEmpty(message = "The name field must be not empty")
    val deliveryAddress: String,

    val user: User

)

fun Customer.toCreatedUserCustomerInfoDTO() = UserCreatedCustomerInfoDTO(
    name = this.name,
    surname = this.surname,
    deliveryAddress = this.deliveryAddress
)