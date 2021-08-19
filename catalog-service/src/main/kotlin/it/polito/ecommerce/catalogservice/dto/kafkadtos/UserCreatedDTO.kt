package it.polito.ecommerce.catalogservice.dto.kafkadtos

import it.polito.ecommerce.catalogservice.domain.Rolename
import java.time.LocalDateTime

data class UserCreatedDTO(
    val id: Long,
    val username: String,
    val email: String,
    val roles: Set<Rolename>,
    val customerInfo: UserCreatedCustomerInfoDTO,
    val emailVerificationTokenInfo: UserCreatedEmailVerificationTokenInfoDTO
)

data class UserCreatedCustomerInfoDTO(
    val name: String,
    val surname: String,
    val deliveryAddress: String,
)

data class UserCreatedEmailVerificationTokenInfoDTO(
    val expirationDate: LocalDateTime,
    val token: String,
)

