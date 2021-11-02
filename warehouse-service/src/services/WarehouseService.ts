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
    // if (products.length === 0) return false;
    const productIdsList = products.map(
      (product: OrderItemDTO) => product.productId
    );
    console.log("PRODUCTIDLIST " , productIdsList)
    const warehouses = await this.warehouseRepository.findWarehouses({});
    console.log('warehouses: ', warehouses);
    const productsAndQuantities = warehouses.reduce((arr: any[], currentWarehouse) => {
      currentWarehouse.products?.forEach(product => {
        arr.push({
          id: product.product._id,
          quantity: product.quantity
        })
      });
      return arr;
    }, []);

    console.log('productsAndQuantities', productsAndQuantities);

    const perProductQuantities = productsAndQuantities.reduce((obj, curr) => {
      const {id, quantity} = curr;
      if (!obj[id]) obj[id] = 0;
      obj[id] += quantity;
      return obj;
    }, {});

    console.log('perProductQuantities', perProductQuantities);

    for (const product of products) {
      const availableQuantity = perProductQuantities[product.productId];
      const requiredQuantity = product.amount;
      console.log('available quantity is ', availableQuantity, ' while required quantity is ', requiredQuantity);
      if (availableQuantity === undefined || availableQuantity < requiredQuantity) {
        console.log('returning false');
        return false;
      }
    }
    console.log('returning true');
    return true;


    // console.log("PROSUCTSAVAILABILY " , productsAvailability)
    // return products.every(({ productId, amount }) => {
    //   console.log("every " , productId in productsAvailability, productsAvailability[productId] >= amount)
    //   return (
    //     productId in productsAvailability &&
    //     productsAvailability[productId] >= amount
    //   );
    // });
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
