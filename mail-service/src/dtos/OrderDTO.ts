export interface OrderDTO {
    id?: string;
    buyerId: number;
    deliveryAddress: string;
    status?: OrderStatusName;
    // items: OrderItemDTO[];
    createdAt?: Date;
}

export type OrderStatusName = "PENDING" | "ISSUED" | "DELIVERING" | "DELIVERED" | "FAILED" | "CANCELED";
