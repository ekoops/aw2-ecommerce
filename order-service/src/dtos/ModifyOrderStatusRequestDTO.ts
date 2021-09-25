import {OrderStatus} from "../domain/OrderStatus";
import User from "../domain/User";

export default interface ModifyOrderStatusRequestDTO {
    orderId: string;
    user: User;
    newStatus: OrderStatus
}
