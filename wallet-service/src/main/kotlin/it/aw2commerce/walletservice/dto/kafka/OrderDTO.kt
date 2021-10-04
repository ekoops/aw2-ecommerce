package it.aw2commerce.walletservice.dto.kafka

import java.util.*

//class OrderDTO(
//    val buyerId: String,
//    val items: List<OrderItemDTO>
//)
enum class  OrderStatusName{
    PENDING,
    ISSUED,
    DELIVERING,
    DELIVERED,
    FAILED,
    CANCELED
}

class OrderDTO(
    val buyerId: String,
    val items: List<OrderItemDTO>,
    val id: String,
    val deliveryAddress: String,
    val status: OrderStatusName,
    val createdAt: Date,
)


data class OrderItemDTO(
    val productId: String,
    val amount: Int,
    val perItemPrice: Double,
    val sources: List<SourceDTO>?
)

data class SourceDTO (
    val warehouseId: String,
    val quantity: Long,
)

//data class OrderItemDTO(
//    val productId: String,
//    val amount: Int,
//    val perItemPrice: Double
//)

