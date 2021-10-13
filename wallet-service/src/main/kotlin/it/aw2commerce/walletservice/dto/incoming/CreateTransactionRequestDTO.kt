package it.aw2commerce.walletservice.dto.incoming

import javax.validation.constraints.NotNull
import javax.validation.constraints.Positive

    data class CreateTransactionRequestDTO(
        @field:NotNull(message = "An amount must be specified")
        val amount: Double,
    )
