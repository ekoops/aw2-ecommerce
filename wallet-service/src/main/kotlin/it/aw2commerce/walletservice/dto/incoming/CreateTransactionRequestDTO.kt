package it.aw2commerce.walletservice.dto.incoming

import javax.validation.constraints.NotNull

    data class CreateTransactionRequestDTO(
        @field:NotNull(message = "An amount must be specified")
        val amount: Double,
    )
