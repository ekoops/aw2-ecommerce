import ErrorResponse from "./ErrorResponse";
import ErrorType from "./ErrorType";
import {OrderStatus} from "../domain/OrderStatus";

export default class OrderStatusChangeNotAllowedResponse extends ErrorResponse {
  constructor(orderId: string, newStatus: OrderStatus) {
    super(
      ErrorType.ORDER_STATUS_CHANGE_FAILED,
      "order status change failed",
      `it is not possible to change the order(${orderId}'s status to ${newStatus}`
    );
  }
}
