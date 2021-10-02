export enum OrderStatus {
    PENDING,
    ISSUED,
    DELIVERING,
    DELIVERED,
    FAILED,
    CANCELLED
}

export const toOrderStatus = (key: string): OrderStatus | undefined => {
    return OrderStatus[status as keyof typeof OrderStatus];
}
export const toOrderStatusName = (orderStatus: OrderStatus): OrderStatusType => {
    return OrderStatus[orderStatus] as OrderStatusType;
}
// export function toStatusName(orderStatus: OrderStatus): OrderStatusType {
//     return OrderStatus[orderStatus] as OrderStatusType;
// }
export type OrderStatusType = "PENDING" | "ISSUED" | "DELIVERING" | "DELIVERED" | "FAILED" | "CANCELED";

