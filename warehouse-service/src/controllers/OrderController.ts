import OrderService from "../services/OrderService";
import { SuccessPayload } from "../kafka/RequestStore";
import OperationType, { OperationTypeUtility } from "../services/OperationType";

export default class OrderController {
  private static _instance: OrderController;
  private constructor(private orderService: OrderService) {}
  static getInstance(orderService: OrderService) {
    return this._instance || (this._instance = new this(orderService));
  }

  handleOrderCRUD = async (message: SuccessPayload) => {
    const { key, value } = message;
    try {
      const changeEventKey = JSON.parse(key);
      const changeEventValue = JSON.parse(value);
      const { schema: keySchema, payload: keyPayload } = changeEventKey;
      const { schema: valueSchema, payload: valuePayload } = changeEventValue;
      const orderId = keyPayload.id["$oid"];
      const operationType = OperationTypeUtility.toOperationType(
        valuePayload.op
      );
      switch (operationType) {
        case OperationType.CREATE:
          const order = JSON.parse(valuePayload.after);
          await this.orderService.handleOrderCreation(order);
          break;
        case OperationType.READ:
          // nothing to do
          break;
        case OperationType.UPDATE:
          await this.orderService.handleOrderUpdating(
            orderId,
            valuePayload.patch
          );
          break;
        case OperationType.DELETE:
          await this.orderService.handleOrderDeletion(orderId);
          break;
        default:
          break;
      }
    } catch (ex) {
      // TODO
    }
  };
}
