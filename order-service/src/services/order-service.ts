import OrderRepositoryNosql from "../repositories/order-repository-nosql";
import { Order } from "../models/Order";
import { OrderStatus, toStatusName } from "../db/OrderStatus";
import AppError from "../models/AppError";
import {
  KafkaException,
  NoValueException,
  ValueParsingFailedException,
  ItemsNotAvailableException,
  CannotProduceException,
  NotEnoughBudgetException,
  WalletOrderCreationFailedException,
  WarehouseOrderCreationFailedException,
  NoHandlersException,
} from "../exceptions/kafka/kafka-exceptions";
import {
  OctCreationFailedException,
  OctRetrievingFailedException,
  OctSavingFailedException,
} from "../exceptions/repositories/repositories-exceptions";
import ProducerProxy from "../kafka/ProducerProxy";
import { generateUUID } from "../utils/utils";
import RequestStore from "../kafka/RequestStore";
import OctRepository from "../repositories/oct-repository";
import {
  ApprovationDTO,
  OrderDTO,
  toOrderDTO,
  toOrderItem,
} from "../dtos/DTOs";

const requestStore = RequestStore.getInstance();

export default class OrderService {
  private static _instance: OrderService;

  private constructor(
    private orderRepository: OrderRepositoryNosql,
    private octRepository: OctRepository,
    private producerProxy: ProducerProxy
  ) {}

  static getInstance(
    orderRepository: OrderRepositoryNosql,
    octRepository: OctRepository,
    producerProxy: ProducerProxy
  ) {
    return (
      this._instance ||
      (this._instance = new this(orderRepository, octRepository, producerProxy))
    );
  }

  getOrders(): Promise<OrderDTO[]> {
    return this.orderRepository
        .findAllOrders()
        .then((orders) => orders.map(toOrderDTO));
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

  rollbackOrderCreation(key: string) {
    return this.producerProxy.producer
      .produce({
        topic: "order-cancelled",
        messages: [{ key: key, value: JSON.stringify(key) }], // TODO: right way?}
      })
      .then(() => new AppError("Order creation failed"))
      .catch(() => {
        // TODO: and now?
        return new AppError("Error creation failed");
      });
  }

  async createOrder(message: { key: string; value: OrderDTO }) {
    const { key, value: orderDTO } = message;

    const order: Order = {
      ...orderDTO,
      items: orderDTO.items.map(toOrderItem),
    };
    let createdOrder;
    try {
      createdOrder = await this.orderRepository.createOrder(order);
    } catch (ex) {
      // if (ex instanceof OrderCreationFailedException) {
      return this.rollbackOrderCreation(key);
      // }
    }

    const createdOrderDTO = toOrderDTO(createdOrder);
    return this.producerProxy.producer
      .produce({
        topic: "order-created",
        messages: [{ key, value: JSON.stringify(createdOrderDTO) }],
      })
      .then(() => createdOrderDTO)
      .catch(() => {
        // TODO: and now?
        return new AppError("Error");
      });
  }

  async handleApproveOrderFailure(err: KafkaException) {
    if (err instanceof CannotProduceException) {
      // request already removed, just return the error to the client
      return new AppError("Order creation failed");
    } else if (err instanceof NoHandlersException) {
      // request handlers are not present: no need to remove them
      return new AppError("Order creation failed");
    } else if (err instanceof NoValueException) {
      requestStore.removeRequestHandlers(err.requestId!);
      return new AppError("Order creation failed");
    } else if (err instanceof ValueParsingFailedException) {
      requestStore.removeRequestHandlers(err.requestId!);
      return new AppError("Order creation failed");
    } else if (
      err instanceof WalletOrderCreationFailedException ||
      err instanceof WarehouseOrderCreationFailedException
    ) {
      // technically, only in this case and in the CannotProduceException case there is
      // the needing to return AppError...
      requestStore.removeRequestHandlers(err.requestId!);
      return this.rollbackOrderCreation(err.requestId!);
    } else {
      return new AppError(err.message);
    }
  }

  //TODO adjust return type
  async handleOct(message: {
    key: string;
    value: ApprovationDTO;
  }): Promise<any> {
    const {
      key: transactionId,
      value: { approver, orderDTO },
    } = message;
    try {
      let oct = await this.octRepository.findOctById(transactionId);
      if (oct === null) {
        // DO NOTHING?
        return new AppError("Error");
      }
      if (approver === "wallet") {
        if (!oct.walletHasApproved) {
          oct.walletHasApproved = true;
          oct = await this.octRepository.save(oct);
        }
      } else if (approver === "warehouse") {
        if (!oct.warehouseHasApproved) {
          oct.warehouseHasApproved = true;
          oct = await this.octRepository.save(oct);
        }
      } else {
        try {
          await this.octRepository.deleteOctById(transactionId);
        } catch (ex) {
          // and now?
        }
        return new AppError("Error");
      }

      if (oct.walletHasApproved && oct.warehouseHasApproved) {
        return this.createOrder({ key: transactionId, value: orderDTO });
      } else {
        return new Promise<{ key: string; value: ApprovationDTO }>(
          (resolve, reject) => {
            requestStore.setRequestHandlers(transactionId, resolve, reject);
          }
        )
          .then(this.handleOct)
          .catch(this.handleApproveOrderFailure);
      }
    } catch (ex) {
      if (
        ex instanceof OctRetrievingFailedException ||
        ex instanceof OctSavingFailedException
      ) {
        try {
          await this.octRepository.deleteOctById(transactionId);
        } catch (ex) {
          // and now?
        }
      }
      return new AppError("Order creation failed");
    }
  }

  async approveOrder(message: { key: string; value: OrderDTO }) {
    const { key, value: orderDTO } = message;

    try {
      await this.octRepository.createOct(key);
    } catch (ex) {
      // if (ex instanceof OctCreationFailedException) {
      requestStore.removeRequestHandlers(key);
      return new AppError("Order creation failed");
      // }
    }

    return this.producerProxy
      .produceAndWaitForResponse<ApprovationDTO>(
        "order-approved",
        orderDTO,
        key
      )
      .then(this.handleOct)
      .catch(this.handleApproveOrderFailure);
  }

  async handleRequestBudgetAvailabilityFailure(err: KafkaException) {
    if (err instanceof CannotProduceException) {
      // request already removed, just return the error to the client
      return new AppError("Order creation failed");
    } else if (err instanceof NoHandlersException) {
      // request handlers are not present: no need to remove them
      return new AppError("Order creation failed");
    } else if (err instanceof NoValueException) {
      requestStore.removeRequestHandlers(err.requestId!);
      return new AppError("Order creation failed");
    } else if (err instanceof ValueParsingFailedException) {
      requestStore.removeRequestHandlers(err.requestId!);
      return new AppError("Order creation failed");
    } else if (err instanceof NotEnoughBudgetException) {
      // technically, only in this case and in the CannotProduceException case there is
      // the needing to return AppError...
      requestStore.removeRequestHandlers(err.requestId!);
      return new AppError("Order creation failed: insufficient budget");
    } else {
      return new AppError(err.message);
    }
  }
  async requestBudgetAvailability(message: { key: string; value: OrderDTO }) {
    const { key, value: orderDTO } = message;
    return this.producerProxy
      .produceAndWaitForResponse<OrderDTO>(
        "budget-availability-requested",
        orderDTO,
        key
      )
      .then(this.approveOrder)
      .catch(this.handleRequestBudgetAvailabilityFailure);
  }

  async handleRequestOrderCreationFailure(err: KafkaException) {
    if (err instanceof CannotProduceException) {
      // request already removed, just return the error to the client
      return new AppError("Order creation failed");
    } else if (err instanceof NoHandlersException) {
      // request handlers are not present: no need to remove them
      return new AppError("Order creation failed");
    } else if (err instanceof NoValueException) {
      requestStore.removeRequestHandlers(err.requestId!);
      return new AppError("Order creation failed");
    } else if (err instanceof ValueParsingFailedException) {
      requestStore.removeRequestHandlers(err.requestId!);
      return new AppError("Order creation failed");
    } else if (err instanceof ItemsNotAvailableException) {
      // technically, only in this case and in the CannotProduceException case there is
      // the needing to return AppError...
      requestStore.removeRequestHandlers(err.requestId!);
      return new AppError("Order creation failed: items not available");
    } else {
      return new AppError("Order creation failed");
    }
  }

  async addOrder(orderDTO: OrderDTO) {
    let uuid: string = generateUUID();
    return this.producerProxy
      .produceAndWaitForResponse<OrderDTO>(
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