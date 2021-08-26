import {OrderStatus, OrderStatusType} from "../db/OrderStatus";
import {OrderItem} from "../models/OrderItem";
import {Order} from "../models/Order";

export interface OrderItemDTO {
    id?: string;
    productId: string;
    amount: number;
    perItemPrice?: number;
}

export interface OrderDTO {
    id?: string;
    buyerId: string;
    createdAt?: Date;
    status?: OrderStatusType;
    items: OrderItemDTO[];
}

export enum Approver {
    WALLET,
    WAREHOUSE
}

export interface ApprovationDTO {
    approverName: "WALLET" | "WAREHOUSE";
    orderDTO: OrderDTO;
}

export const toApprover = (key: string): Approver | undefined => {
    if (!isNaN(Number(key))) return undefined;
    return Approver[key as keyof typeof Approver];
}

export const toOrderDTO = (order: Order): OrderDTO => {
    return {
        id: order._id,
        buyerId: order.buyerId,
        createdAt: order.createdAt,
        status:order.status,
        items: order.items.map(toOrderItemDTO)
    }
}

export const toOrderItemDTO = (orderItem: OrderItem): OrderItemDTO => {
    return {
        id: orderItem._id,
        productId: orderItem.productId,
        amount: orderItem.amount,
        perItemPrice: orderItem.perItemPrice
    }
}

export const toOrderItem = (orderItemDTO: OrderItemDTO): OrderItem => {
    // TODO: check nullability
    return {
        _id: orderItemDTO.id,
        productId: orderItemDTO.productId,
        amount: orderItemDTO.amount,
        perItemPrice: orderItemDTO.perItemPrice!
    }
}


export enum UserRole {
    CUSTOMER,
    ADMIN
}

export const toUserRole = (key: string): UserRole | undefined => {
    return UserRole[key as keyof typeof UserRole];
}

export interface User {
    id: string;
    role: UserRole;
}

export type GetOrdersRequestDTO = User;

export interface GetOrderRequestDTO {
    orderId: string;
    user: User;
}

export type AddOrderRequestDTO = OrderDTO;

export interface ModifyOrderStatusRequestDTO {
    orderId: string;
    user: User;
    newStatus: OrderStatus
}
export interface DeleteOrderRequestDTO {
    orderId: string;
    user: User;
}



