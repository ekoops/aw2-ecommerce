import mongoose, { ClientSession } from "mongoose";
import {Warehouse} from "../domain/Warehouse";
import {DbTransactionFailedException} from "../exceptions/db/DbException";

export default class WarehouseRepository {
  private static _instance: WarehouseRepository;

  constructor(
    private WarehouseModel: mongoose.Model<Warehouse>,
  ) {}

  static getInstance(
    WarehouseModel: mongoose.Model<Warehouse>,
  ) {
    return (
      this._instance ||
      (this._instance = new this(WarehouseModel))
    );
  }

  addWarehousesProducts = async (
    perWarehouseProductsQuantities: any,
    session: ClientSession
  ): Promise<boolean> => {
    const pwpq = perWarehouseProductsQuantities;
    try {
      for (const warehouseId of Object.keys(pwpq)) {
        for (const { productId, quantity } of pwpq[warehouseId]) {
          const warehouse = await this.WarehouseModel.findOne(
              {
                _id: warehouseId,
                "products.$.product._id": productId,
              },
              null,
              { session }
          );
          if (
              warehouse === null ||
              warehouse.products === null ||
              warehouse.products.length !== 1 ||
              warehouse.products[0].quantity < quantity
          ) {
            throw new DbTransactionFailedException();
          }
          await this.WarehouseModel.updateOne(
              { _id: warehouseId, "products.$.product._id": productId },
              { $inc: { "products.$.quantity": quantity } },
              { session }
          );
        }
      }
      return true;
    } catch (ex) {
      return false;
    }
  };
}
