package it.aw2commerce.walletservice.dto.kafka

data class OrderApprovedByWalletDTO(
    val ok: ApprovationDTO? = null,
    val failure: String? = null
)

data class ApprovationDTO(
    val approverName: String = "WALLET",
    val orderDTO: OrderDTO
)