import OrderRepository from "../repositories/OrderRepository";
import ProducerProxy from "../kafka/ProducerProxy";
import { SuccessPayload } from "../kafka/RequestStore";
import ProductService from "./ProductService";
import { Order, OrderDTO } from "../domain/Order";
import { Source } from "../domain/Source";
import mongoose from "mongoose";
import OrderUtility from "../utils/OrderUtility";
import { DbTransactionFailedException } from "../exceptions/db/DbException";
import { OrderItem, OrderItemDTO } from "../domain/OrderItem";
import { OrderStatus } from "../domain/OrderStatus";
import OrderStatusUtility from "../utils/OrderStatusUtility";
import WarehouseService from "./WarehouseService";
import Logger from "../utils/Logger";
import { Warehouse } from "../domain/Warehouse";

const NAMESPACE = "ORDER_SERVICE";

export default class OrderService {
  private static _instance: OrderService;

  private constructor(
    private orderRepository: OrderRepository,
    private warehouseService: WarehouseService,
    private productService: ProductService,
    private producerProxy: ProducerProxy
  ) {}

  static getInstance(
    orderRepository: OrderRepository,
    warehouseService: WarehouseService,
    productService: ProductService,
    producerProxy: ProducerProxy
  ) {
    return (
      this._instance ||
      (this._instance = new this(
        orderRepository,
        warehouseService,
        productService,
        producerProxy
      ))
    );
  }

  checkProductsAvailability = async (message: SuccessPayload) => {
    const { key: transactionId, value: orderDTO } = message;
    const products: OrderItemDTO[] = orderDTO.items;
    console.log("PRODUCTS IS: " + products)
    const areProductsAvailable = await this.warehouseService.verifyProductsAvailability(products);
    console.log("ARE PRODUCTS AVAILABLE: " + areProductsAvailable)
    let response: { [key: string]: OrderDTO | string };
    if (!areProductsAvailable) {
      response = {
        failure: "items are not available",
      };
    } else {
      // the prices are added directly inside the products array
      const arePricesAdded = await this.productService.addProductsPrices(
        products
      );
      console.log("PRODUCTS IS_2: ", products)
      // products.forEach(product => {
      //   product.perItemPrice = 3.33;
      // });
      response = arePricesAdded
        ? { ok: orderDTO }
        : { failure: "per item price insertion failed" };
    }
    Logger.log('OrderService', 'Sending response:' + JSON.stringify(response));
    try {
      await this.producerProxy.producer.produce({
        topic: "order-items-availability-produced",
        messages: [
          {
            key: transactionId,
            value: JSON.stringify(response),
          },
        ],
      });
    } catch (ex) {
      // nothing to do... the order-service will reject the order creation
    }
  };

  private buildSources = (
    totalQuantity: number,
    availableSources: Source[]
  ): Source[] => {
    if (totalQuantity <= 0) return [];

    const sources: Source[] = [];
    let remaining = totalQuantity;
    console.log({availableSources});
    for (const { warehouseId, quantity } of availableSources) {
      const quantityToSubtract = remaining <= quantity ? remaining : quantity;
      remaining -= quantityToSubtract;
      console.log({quantityToSubtract, remaining});
      sources.push({
        warehouseId: warehouseId,
        quantity: quantityToSubtract,
      });
      console.log({sources});

      if (remaining === 0) return sources;
    }
    if (remaining > 0) return [];
    else return sources;
  };

  private buildPerWarehouseProductsQuantities = (products: OrderItem[]) => {
    const perWarehouseProductsQuantities: any = {};
    for (const product of products) {
      const { productId, sources } = product;
      console.log({products, sources})
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

  handleOrderCreation = async (order: Order) => {
    const products = order.items;
    console.log({products})
    if (products.length === 0) return false;

    const productIds = products.map(
      (product: OrderItemDTO) => product.productId
    );

    console.log({productIds})


    // 1) Obtaining an object containing for each key (product id) a source {warehouseId, quantity} list
    // sorted by quantity.
    // const perProductSortedWarehousesAndQuantities =
    //   await this.warehouseService.getPerProductSortedWarehousesAndQuantities(
    //     productIds
    //   );

    const allProducts = await this.productService.findProducts({});
    const allWarehouses  = await this.warehouseService.findWarehouses({}) as Warehouse[];
    console.log('allWarehouses', allWarehouses);
            // the result should have the following form:
        // [
        //   {
        //     _id: product_id1,
        //     warehouses: [
        //         {warehouseId: warehouseId1, quantity: quantity1]},
        //         {warehouseId: warehouseId2, quantity: quantity2]}
        //         ...
        //     ]
        //   },
        //   ...
        // ]
    const result = allProducts.map(product => {
      const obj: any = {};
      obj._id = product._id?.toString();
      obj.warehouses = allWarehouses.map(w => ({
        warehouseId: w._id,
        quantity: w.products?.find(p => p.product._id.toString() === product._id?.toString())?.quantity || 0,
      }));
      console.log({obj: JSON.stringify(obj, null, '  ')});
      return obj;
    });
    let productsLocations: { [key: string]: Source[] } = {};
    result.forEach(
        (e) => (productsLocations[e._id.toString()] = e.warehouses.sort(
          (e1: any, e2: any) => e2.quantity - e1.quantity
        ))
    );

    const perProductSortedWarehousesAndQuantities = productsLocations;
    console.log({perProductSortedWarehousesAndQuantities: JSON.stringify(perProductSortedWarehousesAndQuantities, null, '  ')})

    // checking if the operation failed
    if (Object.keys(perProductSortedWarehousesAndQuantities).length === 0) {
      // TODO: sending failure response to the order-service via kafka
      process.exit(-1);
      return;
    }

    // 2) Assign sources to each product
    for (const product of products) {
      const { productId, amount } = product;
      console.log({ productId, amount });
      const availableSources =
        perProductSortedWarehousesAndQuantities[productId];
      const sources = this.buildSources(amount, availableSources);
      console.log({sources})
      if (sources.length === 0) {
        // TODO: sending failure response to the order-service via kafka
        return;
      }
      product.sources = sources.filter(source => !!source.quantity);
    }

    
    console.log("@@@@@@@@@@@@@@")
    console.log("@@@@@@@@@@@@@@")
    console.log("@@@@@@@@@@@@@@")
    console.log(JSON.stringify(order, null, '  '));
    console.log("@@@@@@@@@@@@@@")
    console.log("@@@@@@@@@@@@@@")
    console.log("@@@@@@@@@@@@@@")


    // 3) If I reach this point, all the products have an own sources list, so now I
    // have to remove the products from warehouses and I must save
    // the order on the db in a single transaction
    try {
      const session = await mongoose.startSession();
      await session.withTransaction(async () => {
        const persistedOrder: Order = await this.orderRepository.createOrder(
          order,
          { session: session }
        );


        const perWarehouseProductsQuantities =
          this.buildPerWarehouseProductsQuantities(products);
          
        const areRemoved = await this.warehouseService.removeWarehousesProducts(
          perWarehouseProductsQuantities,
          session
        );

        const response: any = {};
        if (!areRemoved) {
          await session.abortTransaction();
          // nothing to do... the order will be rejected
          response.failure = "removing products from warehouses failed";
        } else {
          const persistedOrderDTO = OrderUtility.toOrderDTO(persistedOrder);
          response.ok = {
            approverName: "WAREHOUSE",
            orderDTO: persistedOrderDTO,
          };
          if (areRemoved.length) {
            const promises = areRemoved.map(x => {
              return this.producerProxy.producer.produce({
                topic: "warehouse-threshold",
                messages: [
                  {
                    key: order._id,
                    value: JSON.stringify(JSON.stringify(x)),
                  },
                ],
              });
            })
            await Promise.all(promises);
          }
        }
        await this.producerProxy.producer.produce({
          topic: "order-creation-warehouse-response",
          messages: [
            {
              key: order._id,
              value: JSON.stringify(response),
            },
          ],
        });
      });

      session.endSession();
    } catch (ex) {
      // TODO: maybe nothing to do
    }
  };

  handleOrderUpdating = async (orderId: string, patch: string) => {
    try {
      const ISSUED_STATUS = OrderStatusUtility.toOrderStatusName(
        OrderStatus.ISSUED
      );
      if (patch.includes(ISSUED_STATUS)) {
        await this.orderRepository.setStatus(orderId, ISSUED_STATUS);
      }
    } catch (ex) {
      console.log(ex);
      // TODO: the warehouse-cleaner will do the job
    }
  };
  handleOrderDeletion = async (orderId: string) => {
    try {
      const session = await mongoose.startSession();
      await session.withTransaction(async () => {
        const deletedOrder = await this.orderRepository.deleteOrderById(
          orderId
        );
        console.log({deletedOrder, orderId})

        if (deletedOrder === null) {
          console.log('error 1');
          
          throw new DbTransactionFailedException();
        }

        const perWarehouseProductsQuantities = this.buildPerWarehouseProductsQuantities(deletedOrder.items);
        const areAdded = await this.warehouseService.addWarehousesProducts(
          perWarehouseProductsQuantities,
          session
        );

        console.log({perWarehouseProductsQuantities, areAdded})

        if (!areAdded) {
          console.log('error 2');

          throw new DbTransactionFailedException();
        }
      });
      session.endSession();
    } catch (ex) {
      // TODO: and now? maybe i can avoid kafka commit?
    }
  };
}
