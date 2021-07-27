import {
  orderRepository,
  OrderRepositoryNosql,
} from "../repositories/order-repository-nosql";
import { Order, OrderDTO, toOrderDTO } from "../models/Order";
import { OrderStatusType } from "../db/OrderStatus";
import { Product, ProductDTO, toProductDTO } from "../models/Product";

export class OrderService {
  orderRepository: OrderRepositoryNosql;
  constructor(orderRepository: OrderRepositoryNosql) {
    this.orderRepository = orderRepository;
  }
  async getOrder(id: string): Promise<OrderDTO | null> {
    try {
      const order = await orderRepository.findOrderById(id);
      if (order === null) return null;
      return toOrderDTO(order);
    } catch (ex) {
      // TODO handle exception
      return null;
    }
  }

  async getOrders(): Promise<OrderDTO[]> {
    try {
      const orders = await orderRepository.findAllOrders();
      return orders.map(toOrderDTO);
    } catch (ex) {
      // TODO handle exception
      return [];
    }
  }

  async addOrder(orderDTO: OrderDTO): Promise<OrderDTO | null> {
    try {
      const order: Order = {
        buyerId: orderDTO.buyerId,
        products: orderDTO.products.map(
          (product: ProductDTO): Product => ({
            _id: product.id!,
            amount: product.amount!,
            // TODO: the purchasePrice is actually mocked!!
            purchasePrice: 3.0,
          })
        ),
      };
      const createdOrder = await orderRepository.createOrder(order);
      if (createdOrder !== null) return toOrderDTO(createdOrder);
      else return null;
    } catch (ex) {
      // TODO
      console.log(ex);
      return null;
    }
  }

  // modifyOrder(order: OrderDTO) {
  //   return {};
  //   // return orderRepository.updateOrder(order);
  // }

  async deleteOrder(id: string): Promise<boolean> {
    try {
      return await orderRepository.deleteOrderById(id);
    } catch (ex) {
      // TODO handle exception
      return false;
    }
  }
}

export const orderService = new OrderService(orderRepository);
