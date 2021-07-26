enum OrderStatus {
    ISSUED,
    DELIVERING,
    DELIVERED,
    FAILED,
    CANCELED
}

function toStatusName(orderStatus: OrderStatus): string {
    return OrderStatus[orderStatus];
}
type OrderStatusType = "ISSUED" | "DELIVERING" | "DELIVERED" | "FAILED" | "CANCELED";