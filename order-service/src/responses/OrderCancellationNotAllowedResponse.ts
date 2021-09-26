import ErrorType from "./ErrorType";
import ErrorResponse from "./ErrorResponse";

export default class OrderCancellationNotAllowedResponse extends ErrorResponse {
  constructor(orderId: string) {
    super(
      ErrorType.ORDER_CANCELLATION_FAILED,
      "order cancellation failed",
      `it is not possible to cancel the order(${orderId}) since it is no longer in the issued state`
    );
  }
}
