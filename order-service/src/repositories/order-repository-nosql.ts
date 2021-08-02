import { Order, OrderDTO, OrderModel } from "../models/Order";
import { promisify } from "util";
import mongoose, { FilterQuery, CallbackError } from "mongoose";

export class OrderRepositoryNosql {
  private OrderModel: mongoose.Model<Order>;

  constructor(OrderModel: mongoose.Model<Order>) {
    this.OrderModel = OrderModel;
  }

  async findOrderById(id: string): Promise<Order | null> {
    // const findById = promisify<string, Order | null>(
    //   OrderModel.findById.bind(OrderModel)
    // );
    // return findById(id);
    const order = await OrderModel.findById(id);
    console.log(`FIND BY ID(${id}) - `, order);
    return order;
  }

  async findAllOrders(): Promise<Order[]> {
    // const findOrders = promisify<Order[]>(OrderModel.find.bind(OrderModel));

    const orders: Order[] = await OrderModel.find();
    console.log("FIND ALL - ", orders);
    return orders;
  }

  async createOrder(order: Order): Promise<Order> {
    const orderModel = new OrderModel(order);
    const concreteOrder = await orderModel.save();
    console.log("CREATE - ", concreteOrder);
    return concreteOrder;
  }

  async save(order: Order): Promise<Order> {
    // @ts-ignore
    return order.save();
  }

  async deleteOrderById(id: string): Promise<boolean> {
    // const deleteOrder = promisify<FilterQuery<Order>, any>(OrderModel.deleteOne.bind(OrderModel));
    const res = await OrderModel.deleteOne({ _id: id });
    console.log("DELETE - ", res);
    return res.deletedCount === 1;
  }
}
export const orderRepository = new OrderRepositoryNosql(OrderModel);
