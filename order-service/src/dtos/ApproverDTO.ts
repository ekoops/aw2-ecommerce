import {OrderDTO} from "../domain/Order";

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