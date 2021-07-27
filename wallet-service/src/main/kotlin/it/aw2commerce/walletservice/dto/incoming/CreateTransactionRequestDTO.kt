package it.aw2commerce.walletservice.dto.incoming

import javax.validation.constraints.NotNull
import javax.validation.constraints.Positive

    data class CreateTransactionRequestDTO(
        @field:NotNull(message = "An amount must be specified")
        @field:Positive(message = "The amount must be positive")
        val amount: Double,

        @field:NotNull(message = "A recharged wallet id must be specified")
        @field:Positive(message = "The recharged wallet id must be positive")
        val rechargingWalletId: Long,
    )
