import {OrderDTO} from "../domain/Order";


export interface ApprovationDTO {
    approverName: "WALLET" | "WAREHOUSE";
    orderDTO: OrderDTO;
}