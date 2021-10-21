import ErrorType from "./ErrorType";
import ErrorResponse from "./ErrorResponse";

export default class OrderDeletionNotAllowedResponse extends ErrorResponse {
  constructor(orderId: string) {
    super(
      ErrorType.ORDER_DELETION_FAILED,
      "order deletion failed",
      `it is not possible to cancel the order(${orderId}) since it is no longer in the issued state`
    );
  }
}
