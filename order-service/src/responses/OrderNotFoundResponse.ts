import { ErrorResponse } from "./ErrorResponse";
import ErrorType from "./ErrorType";

export default class OrderNotFoundResponse extends ErrorResponse {
  constructor(orderId: string) {
    super(
      ErrorType.ORDER_NOT_FOUND,
      "cannot find the requested order",
      `order with the given id(${orderId}) doesn't exist}`
    );
  }
}
