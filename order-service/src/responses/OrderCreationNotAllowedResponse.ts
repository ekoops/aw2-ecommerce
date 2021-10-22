import OrderCreationFailedResponse from "./OrderCreationFailedResponse";

export default class OrderCreationNotAllowedResponse extends OrderCreationFailedResponse {
    constructor() {
        super("it is not possible to create a new order without a CUSTOMER account");
    }
}
