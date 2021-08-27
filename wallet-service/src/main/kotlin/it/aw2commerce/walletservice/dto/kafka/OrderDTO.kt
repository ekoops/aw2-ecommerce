package it.aw2commerce.walletservice.dto.kafka

class OrderDTO(
    val buyerId: String,
    val items: List<OrderItemDTO>
)

data class OrderItemDTO(
    val productId: String,
    val amount: Int,
    val perItemPrice: Double
)