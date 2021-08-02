import {
  orderRepository,
  OrderRepositoryNosql,
} from "../repositories/order-repository-nosql";
import { Order, OrderDTO, toOrderDTO } from "../models/Order";
import { OrderStatus, toStatusName } from "../db/OrderStatus";
import { Product, ProductDTO } from "../models/Product";
import AppError from "../models/AppError";

export class OrderService {
  constructor(private orderRepository: OrderRepositoryNosql) {}

  getOrder(id: string): Promise<OrderDTO | AppError> {
    return orderRepository.findOrderById(id).then((order) => {
      if (order === null) {
        return new AppError(`No order with id ${id}`);
      } else {
        return toOrderDTO(order);
      }
    }); // can throw
  }

  getOrders(): Promise<OrderDTO[]> {
    return orderRepository
      .findAllOrders()
      .then((orders) => orders.map(toOrderDTO));
  }

  addOrder(orderDTO: OrderDTO): Promise<OrderDTO> {
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
    return orderRepository.createOrder(order).then(toOrderDTO);
  }

  async modifyOrderStatus(
    id: string,
    newStatus: OrderStatus
  ): Promise<OrderDTO | AppError> {
    const order = await orderRepository.findOrderById(id); // can throw
    if (order === null) return new AppError(`No order with id ${id}`);

    // TODO change mock variables
    const isUser = true;
    const isAdmin = false;

    const actualStatus = order.status! as unknown as OrderStatus;
    const actualStatusName = toStatusName(actualStatus);
    const newStatusName = toStatusName(newStatus);
    if (isUser) {
      if (
        actualStatus === OrderStatus.ISSUED &&
        newStatus === OrderStatus.CANCELED
      ) {
        order.status = newStatusName;
        // TODO: recharge user wallet and warehouse product availability
        return orderRepository.save(order).then(toOrderDTO); // can throw
      }
    } else if (isAdmin) {
      if (
        (newStatus === OrderStatus.DELIVERING &&
          actualStatus === OrderStatus.ISSUED) ||
        (newStatus === OrderStatus.DELIVERED &&
          actualStatus === OrderStatus.DELIVERING) ||
        (newStatus === OrderStatus.FAILED &&
          (actualStatus === OrderStatus.ISSUED ||
            actualStatus === OrderStatus.DELIVERING))
      ) {
        if (newStatus === OrderStatus.FAILED) {
          // TODO: recharge user wallet and warehouse product availability
        }
        order.status = toStatusName(newStatus);
        return orderRepository.save(order).then(toOrderDTO); // can throw
      }
    }
    return new AppError(
      `The requested change of state is not allowed (${actualStatusName} -> ${newStatusName})`
    );
  }

  deleteOrder(id: string): Promise<boolean> {
      return orderRepository.deleteOrderById(id);
  }
}

export const orderService = new OrderService(orderRepository);
