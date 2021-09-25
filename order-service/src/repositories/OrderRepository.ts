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
      Logger.dev(NAMESPACE, "findAllOrders(): _", orders);
      return orders;
    } catch (ex) {
      Logger.error(NAMESPACE, "findAllOrders(): _", ex);
      throw new OrdersRetrievingFailedException();
    }
  };
  findUserOrders = async (userId?: number): Promise<Order[]> => {
    try {
      const orders: Order[] = await this.OrderModel.find({ userId })
      return orders;
    } catch (ex) {
      Logger.error(NAMESPACE, "findUserOrders(): _", ex);
      throw new OrdersRetrievingFailedException();
    }
  };


  findOrderById = async (id: string): Promise<Order | null> => {
    try {
      const order = await this.OrderModel.findById(id);
      Logger.dev(NAMESPACE, "findOrderById(id: _): _", id, order);
      return order;
    } catch (ex) {
      Logger.error(NAMESPACE, "findOrderById(id: _): _", id, ex);
      throw new OrdersRetrievingFailedException();
    }
  };
  findUserOrderById = async (userId: number, orderId: string): Promise<Order | null> => {
    try {
      const order = await this.OrderModel.findOne({_id: orderId, buyerId: userId});
      Logger.dev(NAMESPACE, "findUserOrderById(userId: _, orderId: _): _", userId, orderId, order);
      return order;
    } catch (ex) {
      Logger.error(NAMESPACE, "findUserOrderById(userId: _, userId: _): _", userId, orderId, ex);
      throw new OrdersRetrievingFailedException();
    }
  };

  createOrder = async (order: Order): Promise<Order> => {
    const orderModel = new this.OrderModel(order);
    try {
      const concreteOrder = await orderModel.save();
      Logger.dev(NAMESPACE, "createOrder(order: _): _", order, concreteOrder);
      return concreteOrder;
    } catch (ex) {
      Logger.error(NAMESPACE, "createOrder(order: _): _", order, ex);
      throw new OrderCreationFailedException();
    }
  };

  save = async (order: Order): Promise<Order> => {
    try {
      // @ts-ignore
      const updatedOrder = await order.save();
      Logger.dev(NAMESPACE, "save(order: _): _", order, updatedOrder);
      return updatedOrder;
    } catch (ex) {
      Logger.error(NAMESPACE, "save(order: _): _", order, ex);
      throw new OrderSavingFailedException();
    }
  };

  deleteOrderById = async (id: string): Promise<Order | null> => {
    try {
      const deletedOrder = await this.OrderModel.findOneAndDelete({_id: id})
      Logger.dev(NAMESPACE, "deleteOrderById(id: _): _", id, deletedOrder);
      return deletedOrder;
    } catch (ex) {
      Logger.error(NAMESPACE, "deleteOrderById(id: _): _", id, ex);
      throw new OrderDeletionFailedException();
    }
  };
}
export default OrderRepository;
