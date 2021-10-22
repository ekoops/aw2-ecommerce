import ErrorType from "./ErrorType";
import ErrorResponse from "./ErrorResponse";

export default class OrderCreationFailedResponse extends ErrorResponse {
    constructor(message: string) {
        super(
            ErrorType.ORDER_CREATION_FAILED,
            "order creation failed",
                message
        );
    }
}
