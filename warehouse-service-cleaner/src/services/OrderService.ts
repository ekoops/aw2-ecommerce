import WarehouseService from "./WarehouseService";
import mongoose from "mongoose";
import { DbTransactionFailedException } from "../exceptions/db/DbException";
import OrderRepository from "../repositories/OrderRepository";
import {OrderItem} from "../domain/OrderItem";

export default class OrderService {
  private static _instance: OrderService;

  private constructor(
    private orderRepository: OrderRepository,
    private warehouseService: WarehouseService
  ) {}

  static getInstance(
    orderRepository: OrderRepository,
    warehouseService: WarehouseService
  ) {
    return (
      this._instance ||
      (this._instance = new this(orderRepository, warehouseService))
    );
  }

  private buildPerWarehouseProductsQuantities = async (
    products: OrderItem[]
  ) => {
    const perWarehouseProductsQuantities: any = {};

    for (const product of products) {
      const { productId, sources } = product;
      // in the meantime, building the per-warehouse list of product's quantity to subtract
      for (const source of sources) {
        const { warehouseId, quantity } = source;
        const productQuantitiesToSubtract = { productId, quantity };
        if (warehouseId in perWarehouseProductsQuantities)
          perWarehouseProductsQuantities[warehouseId].push(
            productQuantitiesToSubtract
          );
        else
          perWarehouseProductsQuantities[warehouseId] = [
            productQuantitiesToSubtract,
          ];
      }
    }
    return perWarehouseProductsQuantities;
  };

  handleOrderDeletion = async (orderId: string) => {
    try {
      const session = await mongoose.startSession();
      await session.withTransaction(async () => {
        const deletedOrder = await this.orderRepository.deleteOrderById(
          orderId
        );
        if (deletedOrder === null) throw new DbTransactionFailedException();

        const perWarehouseProductsQuantities =
          this.buildPerWarehouseProductsQuantities(deletedOrder.items);
        const areAdded = await this.warehouseService.addWarehousesProducts(
          perWarehouseProductsQuantities,
          session
        );
        if (!areAdded) throw new DbTransactionFailedException();
      });
      session.endSession();
    } catch (ex) {
      // TODO: and now? maybe i can avoid kafka commit?
    }
  };
}
