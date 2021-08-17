import { Order, OrderModel } from "../models/Order";
import mongoose from "mongoose";
import {OrderCreationFailedException} from "../exceptions/repositories/repositories-exceptions";

class OrderRepositoryNosql {
  private static _instance: OrderRepositoryNosql;

  private constructor(private readonly OrderModel: mongoose.Model<Order>) {}

  static getInstance(OrderModel: mongoose.Model<Order>) {
    return this._instance || (this._instance = new this(OrderModel));
  }

  async findOrderById(id: string): Promise<Order | null> {
    // const findById = promisify<string, Order | null>(
    //   OrderModel.findById.bind(OrderModel)
    // );
    // return findById(id);
    const order = await this.OrderModel.findById(id);
    console.log(`FIND BY ID(${id}) - `, order);
    return order;
  }

  async findAllOrders(): Promise<Order[]> {
    // const findOrders = promisify<Order[]>(OrderModel.find.bind(OrderModel));

    const orders: Order[] = await this.OrderModel.find();
    console.log("FIND ALL - ", orders);
    return orders;
  }

  async createOrder(order: Order): Promise<Order> {
    const orderModel = new this.OrderModel(order);
    try {
      const concreteOrder = await orderModel.save();
      console.log("CREATE - ", concreteOrder);
      return concreteOrder;
    }
    catch (ex) {
      throw new OrderCreationFailedException();
    }

  }

  save(order: Order): Promise<Order> {
    // @ts-ignore
    return order.save();
  }

  async deleteOrderById(id: string): Promise<boolean> {
    // const deleteOrder = promisify<FilterQuery<Order>, any>(OrderModel.deleteOne.bind(OrderModel));
    const res = await this.OrderModel.deleteOne({ _id: id });
    console.log("DELETE - ", res);
    return res.deletedCount === 1;
  }
}
export default OrderRepositoryNosql;
