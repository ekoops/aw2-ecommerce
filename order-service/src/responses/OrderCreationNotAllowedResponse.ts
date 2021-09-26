import ErrorType from "./ErrorType";
import ErrorResponse from "./ErrorResponse";

export default class OrderCreationNotAllowedResponse extends ErrorResponse {
    constructor() {
        super(
            ErrorType.ORDER_CREATION_FAILED,
            "order creation failed",
            "it is not possible to create a new order without a CUSTOMER account"
        );
    }
}
