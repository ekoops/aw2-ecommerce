import { Order } from "../models/Order";
import mongoose from "mongoose";
import {
  OrderCreationFailedException,
  OrderDeletionFailedException, OrderSavingFailedException,
  OrdersRetrievingFailedException,
} from "../exceptions/repositories/OrderRepositoryException";
import Logger from "../utils/Logger";

const NAMESPACE = "ORDER_REPOSITORY";

class OrderRepository {
  private static _instance: OrderRepository;

  private constructor(private readonly OrderModel: mongoose.Model<Order>) {}

  static getInstance(OrderModel: mongoose.Model<Order>) {
    return this._instance || (this._instance = new this(OrderModel));
  }

  findOrderById = async (id: string): Promise<Order | null> => {
    try {
      const order = await this.OrderModel.findById(id);
      Logger.dev(NAMESPACE, `findOrderById(id: ${id}): ${JSON.stringify(order)}`);
      return order;
    } catch (ex) {
      Logger.error(NAMESPACE, `findOrderById(id: ${id}): ${JSON.stringify(ex)}`);
      throw new OrdersRetrievingFailedException();
    }
  };

  findOrders = async (buyerId?: number): Promise<Order[]> => {
    try {
      const orders: Order[] = await (buyerId
        ? this.OrderModel.find({ buyerId })
        : this.OrderModel.find());
      Logger.dev(NAMESPACE, `findAllOrders(): ${JSON.stringify(orders)}`);
      return orders;
    } catch (ex) {
      Logger.error(NAMESPACE, `findAllOrders(): ${JSON.stringify(ex)}`);
      throw new OrdersRetrievingFailedException();
    }
  };

  createOrder = async (order: Order): Promise<Order> => {
    const orderModel = new this.OrderModel(order);
    try {
      const concreteOrder = await orderModel.save();
      Logger.dev(NAMESPACE, `createOrder(order: ${JSON.stringify(order)}): ${concreteOrder}`);
      return concreteOrder;
    } catch (ex) {
      Logger.error(NAMESPACE, `createOrder(order: ${JSON.stringify(order)}): ${JSON.stringify(ex)}`);
      throw new OrderCreationFailedException();
    }
  };

  save = async (order: Order): Promise<Order> => {
    try {
      // @ts-ignore
      const updatedOrder = await order.save();
      Logger.dev(NAMESPACE, `save(order: ${JSON.stringify(order)}): ${JSON.stringify(updatedOrder)}`);
      return updatedOrder;
    } catch (ex) {
      Logger.error(NAMESPACE, `save(order: ${JSON.stringify(order)}): ${JSON.stringify(ex)}`);
      throw new OrderSavingFailedException();
    }
  };

  // NOT USED
  deleteOrderById = async (id: string): Promise<Order | null> => {
    try {
      const deletedOrder = await this.OrderModel.findOneAndDelete({_id: id})
      Logger.dev(NAMESPACE, `deleteOrderById(id: ${id}): ${JSON.stringify(deletedOrder)}`);
      return deletedOrder;
    } catch (ex) {
      Logger.error(NAMESPACE, `deleteOrderById(id: ${id}): ${JSON.stringify(ex)}`);
      throw new OrderDeletionFailedException();
    }
  };
}
export default OrderRepository;
