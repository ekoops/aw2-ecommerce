import OrderRepository from "../repositories/order-repository";
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
  DeleteOrderRequestDTO,
  GetOrderRequestDTO,
  OrderDTO,
  PatchOrderRequestDTO,
  toOrderDTO,
  toOrderItem,
  User,
} from "../dtos/DTOs";
import Logger from "../utils/logger";
import {
  OrderNotExistException,
  UnauthorizedException,
} from "../exceptions/exceptions";

const NAMESPACE = "ORDER_SERVICE";

const requestStore = RequestStore.getInstance();

export default class OrderService {
  private static _instance: OrderService;

  private constructor(
    private orderRepository: OrderRepository,
    private octRepository: OctRepository,
    private producerProxy: ProducerProxy
  ) {}

  static getInstance(
    orderRepository: OrderRepository,
    octRepository: OctRepository,
    producerProxy: ProducerProxy
  ) {
    return (
      this._instance ||
      (this._instance = new this(orderRepository, octRepository, producerProxy))
    );
  }

  async getOrders(user: User): Promise<OrderDTO[]> {
    const { role: userRole, id: userId } = user;
    if (userRole !== "ADMIN" && userRole !== "CUSTOMER") {
      Logger.dev(NAMESPACE, `getOrders(user: ${user}): unauthorized`);
      throw new UnauthorizedException();
    }

    const buyerId = userRole === "CUSTOMER" ? userId : undefined;
    const orders = await this.orderRepository.findOrders(buyerId); // can throw
    const ordersDTO = orders.map(toOrderDTO);
    Logger.dev(NAMESPACE, `getOrders(): ${ordersDTO}`);

    return ordersDTO;
  }

  async getOrder(getOrderRequestDTO: GetOrderRequestDTO): Promise<OrderDTO> {
    const {
      orderId,
      user: { role: userRole, id: userId },
    } = getOrderRequestDTO;
    if (userRole !== "ADMIN" && userRole !== "CUSTOMER") {
      Logger.dev(
        NAMESPACE,
        `getOrder(getOrderRequestDTO: ${getOrderRequestDTO}): unauthorized`
      );
      throw new UnauthorizedException();
    }
    const order = await this.orderRepository.findOrderById(orderId); // can throw
    if (order === null) {
      Logger.dev(
        NAMESPACE,
        `getOrder(getOrderRequestDTO: ${getOrderRequestDTO}): null`
      );
      throw new OrderNotExistException();
    }
    if (userRole === "CUSTOMER" && order.buyerId !== userId) {
      Logger.dev(
        NAMESPACE,
        `getOrder(getOrderRequestDTO: ${getOrderRequestDTO}): unauthorized`
      );
      throw new UnauthorizedException();
    }
    const orderDTO = toOrderDTO(order);
    Logger.dev(
      NAMESPACE,
      `getOrder(getOrderRequestDTO: ${getOrderRequestDTO}): ${orderDTO}`
    );
    return orderDTO;
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
    patchOrderRequestDTO: PatchOrderRequestDTO
  ): Promise<OrderDTO | AppError> {
    const {
      orderId,
      user: { role: userRole, id: userId },
      newStatus,
    } = patchOrderRequestDTO;

    const order = await this.orderRepository.findOrderById(orderId); // can throw
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

  async deleteOrder(deleteRequestDTO: DeleteOrderRequestDTO): Promise<void> {
    const {
      orderId,
      user: { role: userRole, id: userId },
    } = deleteRequestDTO;
    if (userRole !== "ADMIN" && userRole !== "CUSTOMER")
      throw new UnauthorizedException();
    if (userRole === "CUSTOMER") {
      const order = await this.orderRepository.findOrderById(orderId);
      if (order === null) {
        Logger.dev(
          NAMESPACE,
          `deleteOrder(deleteRequestDTO: ${deleteRequestDTO}): no order`
        );
        throw new OrderNotExistException();
      }
      if (order.buyerId !== userId) throw new UnauthorizedException();
    }
    const deletedOrder = await this.orderRepository.deleteOrderById(orderId);
    if (deletedOrder === null) {
      Logger.dev(
        NAMESPACE,
        `deleteOrder(deleteRequestDTO: ${deleteRequestDTO}): no order`
      );
      throw new OrderNotExistException();
    } else {
      Logger.dev(
        NAMESPACE,
        `deleteOrder(deleteRequestDTO: ${deleteRequestDTO}): deleted`
      );
      return this.producerProxy.producer
        .produce({
          topic: "order-deleted",
          messages: [{ key: orderId, value: JSON.stringify(deletedOrder) }], // TODO: right way?}
        })
        .then(() => {});
      // .then(() => true)
      // .catch(() => {
      //   // TODO: and now?
      //   return true;
      // });
      // TODO notify on order-deleted
    }
  }
}
