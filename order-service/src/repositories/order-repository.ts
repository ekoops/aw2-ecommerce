import { ModelCtor } from "sequelize";
import models from "../db/db";

export class OrderRepository {
  private OrderModel: ModelCtor<any>;

  constructor(OrderModel: ModelCtor<any>) {
    this.OrderModel = OrderModel;
  }

  findOrderById(id: number): any {
    this.OrderModel.findByPk(id, {
      include
    });
  }

  findAllOrders() {
    return this.OrderModel.findAll;
  }

}
export const orderRepository = new OrderRepository(models.Order);
