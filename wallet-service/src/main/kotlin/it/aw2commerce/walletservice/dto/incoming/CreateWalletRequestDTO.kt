package it.aw2commerce.walletservice.dto.incoming

import javax.validation.constraints.NotNull
import javax.validation.constraints.Positive

data class CreateWalletRequestDTO(
    @field:NotNull(message = "A customer id must be specified")
    @field:Positive(message = "The customer id must be positive")
    val customerId: Long,
)