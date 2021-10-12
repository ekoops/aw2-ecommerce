import { ClientSession } from "mongoose";
import WarehouseRepository from "../repositories/WarehouseRepository";
import { WarehouseRequestDto } from "../domain/Warehouse";
import { OrderItemDTO } from "../domain/OrderItem";

export default class WarehouseService {
  private static _instance: WarehouseService;

  constructor(private warehouseRepository: WarehouseRepository) {}

  static getInstance(warehouseRepository: WarehouseRepository) {
    return this._instance || (this._instance = new this(warehouseRepository));
  }

  findWarehouses = async (filter: {
    [key: string]: any;
  }): Promise<WarehouseRequestDto[]> => {
    const warehouses: WarehouseRequestDto[] =
      await this.warehouseRepository.findWarehouses(filter);
    console.log("service: ", warehouses);
    // const warehousesDto = warehouses.map(warehouse => new WarehouseDto(warehouse));
    return warehouses;
  };

  insertWarehouses = async (warehousesDto: WarehouseRequestDto[]) => {
    const result = await this.warehouseRepository.insertWarehouses(
      warehousesDto
    );
    return result;
  };

  deleteWarehouse = async (warehouseId: string) => {
    return this.warehouseRepository.deleteWarehouse({ _id: warehouseId });
  };

  verifyProductsAvailability = async (
    products: OrderItemDTO[]
  ): Promise<boolean> => {
    if (products.length === 0) return false;
    const productIdsList = products.map(
      (product: OrderItemDTO) => product.productId
    );
    console.log("PRODUCTIDLIST " , productIdsList)
    const productsAvailability = await this.warehouseRepository.getProductsAvailability(productIdsList);
    console.log("PROSUCTSAVAILABILY " , productsAvailability)
    return products.every(({ productId, amount }) => {
      console.log("every " , productId in productsAvailability, productsAvailability[productId] >= amount)
      return (
        productId in productsAvailability &&
        productsAvailability[productId] >= amount
      );
    });
  };

  getPerProductSortedWarehousesAndQuantities = async (
    productIdsList: string[]
  ) => {
    if (productIdsList.length === 0) return {};

    // obtaining an object containing for each key (the product id) a list of couple
    // (warehouseId, quantity)
    const perProductWarehousesAndQuantities =
      await this.warehouseRepository.getPerProductWarehousesAndQuantities(
        productIdsList
      );

    // verifying that a list for each product is present in the above object
    if (
      Object.keys(perProductWarehousesAndQuantities).length !==
      productIdsList.length
    )
      return {};

    // sorting in place each (warehouseId, quantity) list by quantity
    for (const productId of productIdsList) {
      // checking for robustness... but it is not strictly necessary
      if (!(productId in perProductWarehousesAndQuantities)) return {};
      perProductWarehousesAndQuantities[productId].sort(
        (e1, e2) => e2.quantity - e1.quantity
      );
    }
    return perProductWarehousesAndQuantities;
  };

  removeWarehousesProducts = (
    perWarehouseProductsQuantities: any,
    session: ClientSession
  ) => {
    return this.warehouseRepository.removeWarehousesProducts(
      perWarehouseProductsQuantities,
      session
    );
  };

  addWarehousesProducts = (
    perWarehouseProductsQuantities: any,
    session: ClientSession
  ) => {
    return this.warehouseRepository.addWarehousesProducts(
      perWarehouseProductsQuantities,
      session
    );
  };
}
