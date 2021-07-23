import { Order, OrderModel } from "../models/Order";
import { promisify } from "util";
import mongoose, {FilterQuery, CallbackError} from "mongoose";

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
      console.log(order);
      return order;
  }

  async findAllOrders(): Promise<Order[]> {
    // const findOrders = promisify<Order[]>(OrderModel.find.bind(OrderModel));
      const orders: Order[] = await OrderModel.find();
      console.log(orders);
    return orders;
  }
  async deleteOrderById(id: string): Promise<boolean> {
    // const deleteOrder = promisify<FilterQuery<Order>, any>(OrderModel.deleteOne.bind(OrderModel));
      const res = await OrderModel.deleteOne({_id: id});
      console.log(res);
      // @ts-ignore
      return res
  }
}
export const orderRepository = new OrderRepositoryNosql(OrderModel);
