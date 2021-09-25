import User from "../domain/User";

export default interface GetOrderRequestDTO {
    orderId: string;
    user: User;
}