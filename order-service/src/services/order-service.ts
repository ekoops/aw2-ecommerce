import OrderRepository from "../repositories/order-repository";
import { Order } from "../models/Order";
import {
  OrderStatus,
  toOrderStatus,
  toOrderStatusName,
} from "../db/OrderStatus";
import AppError from "../models/AppError";
import {
  CannotProduceException,
  ItemsNotAvailableException,
  KafkaException,
  NoHandlersException,
  NotEnoughBudgetException,
  NoValueException,
  ValueParsingFailedException,
  WalletOrderCreationFailedException,
  WarehouseOrderCreationFailedException,
} from "../exceptions/kafka/kafka-exceptions";
import {
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
  UserRole,
} from "../dtos/DTOs";
import Logger from "../utils/logger";
import {
  NotAllowedException,
  OrderAlreadyCancelledException,
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

    const buyerId = userRole === UserRole.CUSTOMER ? userId : undefined;
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
    const order = await this.orderRepository.findOrderById(orderId); // can throw
    if (order === null) {
      Logger.dev(
        NAMESPACE,
        `getOrder(getOrderRequestDTO: ${getOrderRequestDTO}): null`
      );
      throw new OrderNotExistException();
    }
    if (userRole === UserRole.CUSTOMER && order.buyerId !== userId) {
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
  ): Promise<OrderDTO> {
    const {
      orderId,
      user: { role: userRole, id: userId },
      newStatus,
    } = patchOrderRequestDTO;

    if (userRole !== UserRole.ADMIN) throw new UnauthorizedException();

    const order = await this.orderRepository.findOrderById(orderId); // can throw
    if (order === null) {
      Logger.dev(
        NAMESPACE,
        `modifyOrderStatus(patchOrderRequestDTO: ${patchOrderRequestDTO}): null`
      );
      throw new OrderNotExistException();
    }

    const actualStatus: OrderStatus = toOrderStatus(order.status!)!;
    if (
      (actualStatus === OrderStatus.ISSUED &&
        (newStatus === OrderStatus.DELIVERING ||
          newStatus === OrderStatus.FAILED)) ||
      (actualStatus === OrderStatus.DELIVERING &&
        (newStatus === OrderStatus.DELIVERED ||
          newStatus === OrderStatus.FAILED))
    ) {
      order.status = toOrderStatusName(newStatus);
      const updatedOrder = await this.orderRepository.save(order);
      const updatedOrderDTO = toOrderDTO(updatedOrder);
      return this.producerProxy.producer
        .produce({
          topic:
            newStatus === OrderStatus.FAILED
              ? "order-cancelled"
              : "order-updated",
          messages: [{ key: orderId, value: JSON.stringify(updatedOrder) }],
        })
        .then(() => updatedOrderDTO)
        .catch(() => {
          // TODO and now?
          return updatedOrderDTO;
        });
    } else {
      Logger.dev(
        NAMESPACE,
        `modifyOrderStatus(patchOrderRequestDTO: ${patchOrderRequestDTO}): not allowed`
      );
      throw new NotAllowedException();
    }
  }

  async deleteOrder(deleteRequestDTO: DeleteOrderRequestDTO): Promise<void> {
    const {
      orderId,
      user: { role: userRole, id: userId },
    } = deleteRequestDTO;

    const order = await this.orderRepository.findOrderById(orderId);
    if (order === null) {
      Logger.dev(
        NAMESPACE,
        `deleteOrder(deleteRequestDTO: ${deleteRequestDTO}): no order`
      );
      throw new OrderNotExistException();
    }

    const orderStatus: OrderStatus = toOrderStatus(order.status!)!;

    if (userRole === UserRole.CUSTOMER && order.buyerId !== userId) {
      Logger.dev(
        NAMESPACE,
        `deleteOrder(deleteRequestDTO: ${deleteRequestDTO}): unauthorized`
      );
      throw new UnauthorizedException();
    }

    if (orderStatus === OrderStatus.CANCELLED)
      throw new OrderAlreadyCancelledException();

    if (orderStatus !== OrderStatus.ISSUED) {
      Logger.dev(
        NAMESPACE,
        `deleteOrder(deleteRequestDTO: ${deleteRequestDTO}): not allowed`
      );
      throw new NotAllowedException();
    }

    order.status = toOrderStatusName(OrderStatus.CANCELLED);
    const cancelledOrder = await this.orderRepository.save(order);
    Logger.dev(
      NAMESPACE,
      `deleteOrder(deleteRequestDTO: ${deleteRequestDTO}): ${cancelledOrder}`
    );

    return this.producerProxy.producer
      .produce({
        topic: "order-cancelled",
        messages: [{ key: orderId, value: JSON.stringify(cancelledOrder) }], // TODO: right way?}
      })
      .then(() => {});
  }
}
