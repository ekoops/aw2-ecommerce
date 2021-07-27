export enum OrderStatus {
    ISSUED,
    DELIVERING,
    DELIVERED,
    FAILED,
    CANCELED
}

export function toStatusName(orderStatus: OrderStatus): string {
    return OrderStatus[orderStatus];
}
export type OrderStatusType = "ISSUED" | "DELIVERING" | "DELIVERED" | "FAILED" | "CANCELED";