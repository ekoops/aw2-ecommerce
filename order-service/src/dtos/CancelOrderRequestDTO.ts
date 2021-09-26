import User from "../domain/User";

export default interface CancelOrderRequestDTO {
    orderId: string;
    user: User;
}