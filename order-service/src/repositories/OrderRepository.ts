import { Order } from "../domain/Order";
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

  findOrders = async (): Promise<Order[]> => {
    try {
      const orders: Order[] = await this.OrderModel.find();
      Logger.dev(NAMESPACE, "findAllOrders(): %v", orders);
      return orders;
    } catch (ex) {
      Logger.error(NAMESPACE, "findAllOrders(): %v", ex);
      throw new OrdersRetrievingFailedException();
    }
  };
  findUserOrders = async (userId: number): Promise<Order[]> => {
    try {
      const orders: Order[] = await this.OrderModel.find({ buyerId: userId })
      Logger.dev(NAMESPACE, "findUserOrders(userId: %v): %v",  userId, orders);
      return orders;
    } catch (ex) {
      Logger.error(NAMESPACE, "findUserOrders(userId: %v): %v", userId,  ex);
      throw new OrdersRetrievingFailedException();
    }
  };


  findOrderById = async (id: string): Promise<Order | null> => {
    try {
      const order = await this.OrderModel.findById(id);
      Logger.dev(NAMESPACE, "findOrderById(id: %v): %v", id, order);
      return order;
    } catch (ex) {
      Logger.error(NAMESPACE, "findOrderById(id: %v): %v", id, ex);
      throw new OrdersRetrievingFailedException();
    }
  };
  findUserOrderById = async (userId: number, orderId: string): Promise<Order | null> => {
    try {
      const order = await this.OrderModel.findOne({_id: orderId, buyerId: userId});
      Logger.dev(NAMESPACE, "findUserOrderById(userId: %v, orderId: %v): %v", userId, orderId, order);
      return order;
    } catch (ex) {
      Logger.error(NAMESPACE, "findUserOrderById(userId: %v, userId: %v): %v", userId, orderId, ex);
      throw new OrdersRetrievingFailedException();
    }
  };

  createOrder = async (order: Order): Promise<Order> => {
    const orderModel = new this.OrderModel(order);
    try {
      const concreteOrder = await orderModel.save();
      Logger.dev(NAMESPACE, "createOrder(order: %v): %v", order, concreteOrder);
      return concreteOrder;
    } catch (ex) {
      Logger.error(NAMESPACE, "createOrder(order: %v): %v", order, ex);
      throw new OrderCreationFailedException();
    }
  };

  save = async (order: Order): Promise<Order> => {
    try {
      // @ts-ignore
      const updatedOrder = await order.save();
      Logger.dev(NAMESPACE, "save(order: %v): %v", order, updatedOrder);
      return updatedOrder;
    } catch (ex) {
      Logger.error(NAMESPACE, "save(order: %v): %v", order, ex);
      throw new OrderSavingFailedException();
    }
  };

  deleteOrderById = async (id: string): Promise<Order | null> => {
    try {
      const deletedOrder = await this.OrderModel.findOneAndDelete({_id: id})
      Logger.dev(NAMESPACE, "deleteOrderById(id: %v): %v", id, deletedOrder);
      return deletedOrder;
    } catch (ex) {
      Logger.error(NAMESPACE, "deleteOrderById(id: %v): %v", id, ex);
      throw new OrderDeletionFailedException();
    }
  };
}
export default OrderRepository;
