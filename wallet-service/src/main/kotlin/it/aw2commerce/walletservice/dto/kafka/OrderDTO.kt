package it.aw2commerce.walletservice.dto.kafka

import com.fasterxml.jackson.annotation.JsonProperty
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
    val buyerId: Long,
    val items: List<OrderItemDTO>,
    // val id: String,
    val deliveryAddress: String,
    // val status: OrderStatusName,
    // val createdAt: Date,
)


//data class OrderItemDTO(
//    val productId: String,
//    val amount: Int,
//    val perItemPrice: Double,
//    val sources: List<SourceDTO>?
//)
data class OrderItemDTO(
    @JsonProperty("productId")
    val productId: String,
    @JsonProperty("amount")
    val amount: Int,
    @JsonProperty("perItemPrice")
    val perItemPrice: Double,
    @JsonProperty("sources")
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

