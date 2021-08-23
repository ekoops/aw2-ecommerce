import { Order } from "../models/Order";
import mongoose from "mongoose";
import {
  OrderCreationFailedException,
  OrderDeletionFailedException, OrderSavingFailedException,
  OrdersRetrievingFailedException,
} from "../exceptions/repositories/repositories-exceptions";
import Logger from "../utils/logger";

const NAMESPACE = "ORDER_REPOSITORY";

class OrderRepository {
  private static _instance: OrderRepository;

  private constructor(private readonly OrderModel: mongoose.Model<Order>) {}

  static getInstance(OrderModel: mongoose.Model<Order>) {
    return this._instance || (this._instance = new this(OrderModel));
  }

  async findOrderById(id: string): Promise<Order | null> {
    try {
      const order = await this.OrderModel.findById(id);
      Logger.dev(NAMESPACE, `findOrderById(id: ${id}): ${order}`);
      return order;
    } catch (ex) {
      Logger.error(NAMESPACE, `findOrderById(id: ${id}): ${ex}`);
      throw new OrdersRetrievingFailedException();
    }
  }

  async findOrders(buyerId?: string): Promise<Order[]> {
    try {
      const orders: Order[] = await (buyerId
        ? this.OrderModel.find({ buyerId })
        : this.OrderModel.find());
      Logger.dev(NAMESPACE, `findAllOrders(): ${orders}`);
      return orders;
    } catch (ex) {
      Logger.error(NAMESPACE, `findAllOrders(): ${ex}`);
      throw new OrdersRetrievingFailedException();
    }
  }
  async findUserOrders(userId: string) {
    try {
      const orders: Order[] = await this.OrderModel.find({ buyerId: userId });
      Logger.dev(NAMESPACE, `findAllOrders(): ${orders}`);
      return orders;
    } catch (ex) {
      Logger.error(NAMESPACE, `findAllOrders(): ${ex}`);
      throw new OrdersRetrievingFailedException();
    }
  }

  async createOrder(order: Order): Promise<Order> {
    const orderModel = new this.OrderModel(order);
    try {
      const concreteOrder = await orderModel.save();
      Logger.dev(NAMESPACE, `createOrder(order: ${order}): ${concreteOrder}`);
      return concreteOrder;
    } catch (ex) {
      Logger.error(NAMESPACE, `createOrder(order: ${order}): ${ex}`);
      throw new OrderCreationFailedException();
    }
  }

  async save(order: Order): Promise<Order> {
    try {
      // @ts-ignore
      const res = await order.save();
      Logger.dev(NAMESPACE, `save(order: ${order}): ${res}`);
      return res;
    } catch (ex) {
      Logger.error(NAMESPACE, `save(order: ${order}): ${ex}`);
      throw new OrderSavingFailedException();
    }
  }

  async deleteOrderById(id: string): Promise<Order | null> {
    try {
      const deletedOrder = await this.OrderModel.findOneAndDelete({_id: id})
      Logger.dev(NAMESPACE, `deleteOrderById(id: ${id}): ${deletedOrder}`);
      return deletedOrder;
    } catch (ex) {
      Logger.error(NAMESPACE, `deleteOrderById(id: ${id}): ${ex}`);
      throw new OrderDeletionFailedException();
    }
  }
}
export default OrderRepository;
