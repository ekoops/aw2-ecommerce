package it.aw2commerce.walletservice.dto.kafka

// The two properties are mutually exclusive
data class BudgetAvailabilityProducedDTO(
    val ok: OrderDTO? = null,
    val failure: String? = null
)
