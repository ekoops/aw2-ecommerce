import {OrderStatus} from "../db/OrderStatus";
import {OrderDTO} from "../models/Order";

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

export enum UserRole {
    CUSTOMER,
    ADMIN
}

export const toUserRole = (key: string): UserRole | undefined => {
    return UserRole[key as keyof typeof UserRole];
}

export interface User {
    id: number;
    role: UserRole;
    deliveryAddress: string;
}

export type GetOrdersRequestDTO = User;

export interface GetOrderRequestDTO {
    orderId: string;
    user: User;
}

export type CreateOrderRequestDTO = OrderDTO;

export interface ModifyOrderStatusRequestDTO {
    orderId: string;
    user: User;
    newStatus: OrderStatus
}
export interface DeleteOrderRequestDTO {
    orderId: string;
    user: User;
}



