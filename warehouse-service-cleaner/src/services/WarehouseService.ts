import WarehouseRepository from "../repositories/WarehouseRepository";
import { ClientSession } from "mongoose";

export default class WarehouseService {
  private static _instance: WarehouseService;

  constructor(
    private warehouseRepository: WarehouseRepository,
  ) {}

  static getInstance(
    warehouseRepository: WarehouseRepository,
  ) {
    return (
      this._instance ||
      (this._instance = new this(
        warehouseRepository
      ))
    );
  }

  addWarehousesProducts = (
      perWarehouseProductsQuantities: any,
      session: ClientSession
  ) => {
    return this.warehouseRepository.addWarehousesProducts(
        perWarehouseProductsQuantities,
        session
    );
  }
}
