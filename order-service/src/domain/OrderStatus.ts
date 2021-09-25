export enum OrderStatus {
    PENDING,
    ISSUED,
    DELIVERING,
    DELIVERED,
    FAILED,
    CANCELLED
}

export type OrderStatusName = "PENDING" | "ISSUED" | "DELIVERING" | "DELIVERED" | "FAILED" | "CANCELED";

