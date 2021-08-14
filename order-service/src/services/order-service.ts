import {
  OrderRepositoryNosql,
} from "../repositories/order-repository-nosql";
import { Order, OrderDTO, toOrderDTO } from "../models/Order";
import { OrderStatus, toStatusName } from "../db/OrderStatus";
import { toOrderItem } from "../models/OrderItem";
import AppError from "../models/AppError";
import {
  KafkaException,
  NoValueException,
  ValueParsingFailedException,
  ItemsNotAvailableException,
  CannotProduceException,
  NotEnoughBudgetException, WalletOrderCreationFailureException, WarehouseOrderCreationFailureException,
} from "../exceptions/kafka/kafka-exceptions";
import {OrderCreationFailureException} from "../exceptions/repositories/repositories-exceptions";
import ProducerProxy from "../kafka/ProducerProxy";
import {generateUUID} from "../kafka/utils";

const requests: { [key: string]: [Function, Function] } = {};

export class OrderService {
  private static _instance: OrderService;

  private constructor(
    private orderRepository: OrderRepositoryNosql,
    private producerProxy: ProducerProxy,
  ) {}

  static getInstance(orderRepository: OrderRepositoryNosql, producerProxy: ProducerProxy) {
    return this._instance || (this._instance = new this(orderRepository, producerProxy));
  }

  getOrder(id: string): Promise<OrderDTO | AppError> {
    return this.orderRepository.findOrderById(id).then((order) => {
      if (order === null) {
        return new AppError(`No order with id ${id}`);
      } else {
        return toOrderDTO(order);
      }
    }); // can throw
  }

  getOrders(): Promise<OrderDTO[]> {
    return this.orderRepository
      .findAllOrders()
      .then((orders) => orders.map(toOrderDTO));
  }


  async createOrder(message: {
    key: string;
    value: OrderDTO;
  }) {
    const { key, value: orderDTO } = message;

    const order: Order = {
      ...orderDTO,
      items: orderDTO.items.map(toOrderItem)
    };
    try {
      const createdOrder = await this.orderRepository.createOrder(
          order
      );
      const createdOrderDTO = toOrderDTO(createdOrder);
      await this.producerProxy.produceAndWaitForResponse<OrderDTO>(
          "order-created",
          createdOrderDTO,
          key
      ).then(this.createOrder).catch(this.handleApproveOrderFailure);
    }
    catch (ex) {
      if (ex instanceof OrderCreationFailureException) {
        // TODO rollback all order
        await this.producerProxy.produceAndWaitForResponse<OrderDTO>(
            "order-creation-failed",
            orderDTO,
            key
        ).then(() => new AppError("Order creation failed")).catch(() => {
          // and now?
          return new AppError("and now?");
        });
      }
      else {
        // TODO and now?
        return new AppError("and now?");
      }
    }

  }

  async handleApproveOrderFailure(err: KafkaException) {
    if (err instanceof CannotProduceException) {
    } else if (err instanceof NoValueException) {
    } else if (err instanceof ValueParsingFailedException) {
    } else if (err instanceof WalletOrderCreationFailureException) {
    } else if (err instanceof WarehouseOrderCreationFailureException) {
    } else {
      throw new AppError(err.message);
    }
  }

  async approveOrder(message: {
    key: string;
    value: OrderDTO;
  }) {
    const { key, value: orderDTO } = message;
    // if the following promise is resolved, the order can be created
    return this.producerProxy.produceAndWaitForResponse<OrderDTO>(
        "order-approved",
        orderDTO,
        key
    ).then(this.createOrder).catch(this.handleApproveOrderFailure);
  }

  async handleRequestBudgetAvailabilityFailure(err: KafkaException) {
    if (err instanceof CannotProduceException) {
    } else if (err instanceof NoValueException) {
    } else if (err instanceof ValueParsingFailedException) {
    } else if (err instanceof NotEnoughBudgetException) {
    } else {
      throw new AppError(err.message);
    }
  }
  async requestBudgetAvailability(message: {
    key: string;
    value: OrderDTO;
  }) {
    const { key, value: orderDTO } = message;
    return this.producerProxy.produceAndWaitForResponse<OrderDTO>(
      "budget-availability-requested",
      orderDTO,
      key
    )
      .then(this.approveOrder)
      .catch(this.handleRequestBudgetAvailabilityFailure);
  }
  async handleRequestOrderCreationFailure(err: KafkaException) {
    if (err instanceof CannotProduceException) {
    } else if (err instanceof NoValueException) {
    } else if (err instanceof ValueParsingFailedException) {
    } else if (err instanceof ItemsNotAvailableException) {
    } else {
      throw new AppError(err.message);
    }
  }

  async requestOrderCreation(orderDTO: OrderDTO) {
    let uuid: string = generateUUID(this.producerProxy.requestStore);
    return this.producerProxy.produceAndWaitForResponse<OrderDTO>(
      "order-creation-requested",
      orderDTO,
      uuid
    )
      .then(this.requestBudgetAvailability)
      .catch(this.handleRequestOrderCreationFailure);
  }

  async modifyOrderStatus(
    id: string,
    newStatus: OrderStatus
  ): Promise<OrderDTO | AppError> {
    const order = await this.orderRepository.findOrderById(id); // can throw
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
        return this.orderRepository.save(order).then(toOrderDTO); // can throw
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
        return this.orderRepository.save(order).then(toOrderDTO); // can throw
      }
    }
    return new AppError(
      `The requested change of state is not allowed (${actualStatusName} -> ${newStatusName})`
    );
  }

  deleteOrder(id: string): Promise<boolean> {
    return this.orderRepository.deleteOrderById(id);
  }
}

export default OrderService