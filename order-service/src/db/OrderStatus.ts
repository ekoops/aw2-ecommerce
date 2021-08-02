import {type} from "os";

export enum OrderStatus {
    ISSUED,
    DELIVERING,
    DELIVERED,
    FAILED,
    CANCELED
}

export function toStatusName(orderStatus: OrderStatus): OrderStatusType {
    return OrderStatus[orderStatus] as OrderStatusType;
}
export type OrderStatusType = "ISSUED" | "DELIVERING" | "DELIVERED" | "FAILED" | "CANCELED";

