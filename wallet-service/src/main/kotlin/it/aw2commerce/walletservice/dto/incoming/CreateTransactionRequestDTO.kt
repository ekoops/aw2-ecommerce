package it.aw2commerce.walletservice.dto.incoming

import javax.validation.constraints.NotNull
import javax.validation.constraints.Positive

    data class CreateTransactionRequestDTO(
        @field:NotNull(message = "An amount must be specified")
        val amount: Double,

        //TODO this must be a reference for orderId o rechargeId
        @field:NotNull(message = "A order id must be specified")
        @field:Positive(message = "The order id must be positive")
        val orderId: Long,
    )
