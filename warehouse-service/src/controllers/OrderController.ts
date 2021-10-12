import OrderService from "../services/OrderService";
import { SuccessPayload } from "../kafka/RequestStore";
import OperationType, { OperationTypeUtility } from "../services/OperationType";

export default class OrderController {
  private static _instance: OrderController;
  private constructor(private orderService: OrderService) {}
  static getInstance(orderService: OrderService) {
    return this._instance || (this._instance = new this(orderService));
  }

  checkProductsAvailability = async (key: string, value: string | undefined) => {
    console.log('@!@!@!@!@!@!@!@!@!@!@!@!');
    console.log('@!@!@!@!@!@!@!@!@!@!@!@!');
    console.log('@!@!@!@!@!@!@!@!@!@!@!@!');
    console.log('@!@!@!@!@!@!@!@!@!@!@!@!');
    console.log('Key: ', key);
    console.log('Value: ', value);
    console.log('@!@!@!@!@!@!@!@!@!@!@!@!');
    console.log('@!@!@!@!@!@!@!@!@!@!@!@!');
    console.log('@!@!@!@!@!@!@!@!@!@!@!@!');
    console.log('@!@!@!@!@!@!@!@!@!@!@!@!');

    let obj;
    try {
      obj = JSON.parse(value as string);
    } catch (ex) {
      return;
    }
    return this.orderService.checkProductsAvailability({key: key, value: obj});
  }

  handleOrderCRUD = async (key: string, value: string | undefined) => {
    try {
      if (value === undefined) return;
      const changeEventKey = JSON.parse(key);
      const changeEventValue = JSON.parse(value);
      console.log({changeEventKey, changeEventValue})
      const { schema: keySchema, payload: keyPayload } = changeEventKey;
      const { schema: valueSchema, payload: valuePayload } = changeEventValue;
      const orderIdStr = keyPayload.id;
      const orderId = JSON.parse(orderIdStr)["$oid"];
      console.log({orderId})

      const operationType = OperationTypeUtility.toOperationType(
        valuePayload.op
      );

      console.log({operationType})

      switch (operationType) {
        case OperationType.CREATE:
          const order = JSON.parse(valuePayload.after);
          order.id = orderId;
          console.log({order})
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
