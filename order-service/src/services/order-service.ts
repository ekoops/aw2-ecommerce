import OrderRepository from "../repositories/order-repository";
import { Order } from "../models/Order";
import {
  OrderStatus,
  toOrderStatus,
  toOrderStatusName,
} from "../db/OrderStatus";
import FailureWrapper from "../models/FailureWrapper";
import { CannotProduceException } from "../exceptions/kafka/kafka-exceptions";
import ProducerProxy from "../kafka/ProducerProxy";
import {force, generateUUID} from "../utils/utils";
import RequestStore, {
  FailurePayload,
  SuccessPayload,
} from "../kafka/RequestStore";
import OctRepository from "../repositories/oct-repository";
import {
  AddOrderRequestDTO,
  ApprovationDTO,
  Approver,
  DeleteOrderRequestDTO,
  GetOrderRequestDTO,
  GetOrdersRequestDTO,
  ModifyOrderStatusRequestDTO,
  OrderDTO,
  toApprover,
  toOrderDTO,
  toOrderItem,
  UserRole,
} from "../dtos/DTOs";
import Logger from "../utils/logger";
import {
  NotAllowedException,
  OrderAlreadyCancelledException,
  OrderNotExistException,
  UnauthorizedException,
} from "../exceptions/exceptions";
import {
  NoOctException,
  OctHandlingFailedException,
} from "../exceptions/application-exceptions";
import {
  ValueFormatNotValidException,
} from "../exceptions/communication-exceptions";

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

  getOrders = async (
    getOrdersRequestDTO: GetOrdersRequestDTO
  ): Promise<OrderDTO[]> => {
    const { role: userRole, id: userId } = getOrdersRequestDTO;

    const buyerId = userRole === UserRole.CUSTOMER ? userId : undefined;
    const orders = await this.orderRepository.findOrders(buyerId); // can throw
    const ordersDTO = orders.map(toOrderDTO);
    Logger.dev(NAMESPACE, `getOrders(): ${ordersDTO}`);

    return ordersDTO;
  };

  getOrder = async (
    getOrderRequestDTO: GetOrderRequestDTO
  ): Promise<OrderDTO> => {
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
  };

  cancelOrder = (transactionId: string): Promise<any> => {
    return this.producerProxy.producer.produce({
      topic: "order-creation-cancelled",
      // notice no key in the message...
      messages: [{ value: JSON.stringify({ transactionId }) }], // TODO: right way?
    });
  };

  createOrder = async (message: {
    key: string;
    value: OrderDTO;
  }): Promise<OrderDTO | FailureWrapper> => {
    const { key, value: orderDTO } = message;

    const order: Order = {
      ...orderDTO,
      items: orderDTO.items.map(toOrderItem),
    };

    let createdOrderDTO: OrderDTO | undefined;
    try {
      const createdOrder = await this.orderRepository.createOrder(order);

      createdOrderDTO = toOrderDTO(createdOrder);
      await this.producerProxy.producer.produce({
        topic: "order-created",
        messages: [{ key, value: JSON.stringify(createdOrderDTO) }],
      });
      return createdOrderDTO;
    } catch (ex) {
      // the exception can be only of type OrderCreationFailedException or CannotProduceException
      force(this.cancelOrder, key);
      force(this.octRepository.deleteOctById, key);
      if (ex instanceof CannotProduceException) {
        // the order was created... need to delete order on the db
        force(this.orderRepository.deleteOrderById, createdOrderDTO!.id!);
      }
      requestStore.remove(key);
      return new FailureWrapper("Order creation failed");
    }
  };

  handleOct = async (message: {
    key: string;
    value: ApprovationDTO;
  }): Promise<OrderDTO | FailureWrapper> => {
    const {
      key: transactionId,
      value: { approverName, orderDTO },
    } = message;
    const approver = toApprover(approverName);
    if (approver === undefined) {
      return this.handleApproveOrderFailure(
        new ValueFormatNotValidException(transactionId)
      );
    }

    let oct;
    try {
      oct = await this.octRepository.findOctById(transactionId);
      if (oct === null) {
        return this.handleApproveOrderFailure(new NoOctException(transactionId));
      }
      if (approver === Approver.WALLET) {
        if (!oct.walletHasApproved) {
          oct.walletHasApproved = true;
          oct = await this.octRepository.save(oct);
        }
      } else {
        // the approver is the warehouse service...
        if (!oct.warehouseHasApproved) {
          oct.warehouseHasApproved = true;
          oct = await this.octRepository.save(oct);
        }
      }
    } catch (ex) {
      // the exception can be only of type OctRetrievingFailedException or OctSavingFailedException
      return this.handleApproveOrderFailure(
        new OctHandlingFailedException(transactionId)
      );
    }

    if (oct.walletHasApproved && oct.warehouseHasApproved) {
      return this.createOrder({ key: transactionId, value: orderDTO });
    } else {
      return new Promise<{ key: string; value: ApprovationDTO }>(
        (resolve, reject) => {
          requestStore.set(transactionId, resolve, reject);
        }
      )
        .then(this.handleOct)
        .catch(this.handleApproveOrderFailure);
    }
  };

  handleApproveOrderFailure = async (
    err: FailurePayload
  ): Promise<FailureWrapper> => {
    if (!(err instanceof CannotProduceException)) {
      force(this.cancelOrder, err.transactionId);
    }

    if (!(err instanceof NoOctException)) {
      force(this.octRepository.deleteOctById, err.transactionId); // no need to check the return value
    }

    requestStore.remove(err.transactionId);
    return new FailureWrapper("Order creation failed");

    // if (err instanceof CannotProduceException) {
    //   // request already removed, just return the error to the client
    //   this.octRepository.deleteOctById(err.transactionId);
    //   return new FailureWrapper("Order creation failed");
    // } else if (err instanceof NoHandlersException) {
    //   // request handlers are not present: no need to remove them
    //   // the oct possibly created oct has to be deleted, but we don't have
    //   return new FailureWrapper("Order creation failed");
    // } else if (err instanceof NoValueException) {
    //   requestStore.remove(err.transactionId);
    //   return new FailureWrapper("Order creation failed");
    // } else if (err instanceof ValueParsingFailedException) {
    //   requestStore.remove(err.transactionId);
    //   return new FailureWrapper("Order creation failed");
    // } else if (err instanceof ValueFormatNotValidException) {
    //   requestStore.remove(err.transactionId);
    //   return new FailureWrapper("Order creation failed");
    // } else if (
    //   err instanceof WalletOrderCreationFailedException ||
    //   err instanceof WarehouseOrderCreationFailedException
    // ) {
    //   // technically, only in this case and in the CannotProduceException case there is
    //   // the needing to return AppError...
    //   requestStore.remove(err.transactionId);
    //   return this.cancelOrder(err.transactionId);
    // } else {
    //   return new FailureWrapper(err.message);
    // }
  };

  approveOrder = async (
    message: SuccessPayload
  ): Promise<OrderDTO | FailureWrapper> => {
    const { key, value: orderDTO } = message;

    try {
      await this.octRepository.createOct(key);
    } catch (ex) {
      // the exception can only be an OctCreationFailedException
      // if (ex instanceof OctCreationFailedException) {
      requestStore.remove(key);
      return new FailureWrapper("Order creation failed");
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
  };

  handleRequestBudgetAvailabilityFailure = (
    err: FailurePayload
  ): FailureWrapper => {
    Logger.dev(
      NAMESPACE,
      `handleRequestOrderCreationFailure(err: ${err.constructor.name})`
    );
    // the commented code below can be simplified with these two statements
    //
    requestStore.remove(err.transactionId);
    return new FailureWrapper("Order creation failed");

    // the following code may be useful in future update...
    // if (err instanceof CannotProduceException) {
    //   // request already removed, just return the error to the client
    //   return new FailureWrapper("Order creation failed");
    // } else if (err instanceof NoHandlersException) {
    //   // request handlers are not present: no need to remove them
    //   return new FailureWrapper("Order creation failed");
    // } else if (err instanceof NoValueException) {
    //   requestStore.remove(err.transactionId);
    //   return new FailureWrapper("Order creation failed");
    // } else if (err instanceof ValueParsingFailedException) {
    //   requestStore.remove(err.transactionId);
    //   return new FailureWrapper("Order creation failed");
    // } else if (err instanceof ValueFormatNotValidException) {
    //   requestStore.remove(err.transactionId);
    //   return new FailureWrapper("Order creation failed");
    // } else if (err instanceof NotEnoughBudgetException) {
    //   requestStore.remove(err.transactionId);
    //   return new FailureWrapper("Order creation failed: insufficient budget");
    // } else {
    //   return new FailureWrapper(err.message);
    // }
  };
  requestBudgetAvailability = (
    message: SuccessPayload
  ): Promise<OrderDTO | FailureWrapper> => {
    const { key, value: orderDTO } = message;
    return this.producerProxy
      .produceAndWaitForResponse<OrderDTO>(
        "budget-availability-requested",
        orderDTO,
        key
      )
      .then(this.approveOrder)
      .catch(this.handleRequestBudgetAvailabilityFailure);
  };

  handleRequestOrderCreationFailure = (err: FailurePayload): FailureWrapper => {
    Logger.dev(
      NAMESPACE,
      `handleRequestOrderCreationFailure(err: ${err.constructor.name})`
    );
    // the commented code below can be simplified with these two statements
    //
    requestStore.remove(err.transactionId);
    return new FailureWrapper("Order creation failed");

    // the following code may be useful in future update...
    // if (err instanceof CannotProduceException) {
    //   // request already removed, just return the error to the client
    //   return new FailureWrapper("Order creation failed");
    // } else if (err instanceof NoHandlersException) {
    //   // request handlers are not present: no need to remove them
    //   return new FailureWrapper("Order creation failed");
    // } else if (err instanceof NoValueException) {
    //   requestStore.remove(err.transactionId);
    //   return new FailureWrapper("Order creation failed");
    // } else if (err instanceof ValueParsingFailedException) {
    //   requestStore.remove(err.transactionId);
    //   return new FailureWrapper("Order creation failed");
    // } else if (err instanceof ValueFormatNotValidException) {
    //   requestStore.remove(err.transactionId);
    //   return new FailureWrapper("Order creation failed");
    // } if (err instanceof ItemsNotAvailableException) {
    //   requestStore.remove(err.transactionId);
    //   return new FailureWrapper("Order creation failed: items not available");
    // } else {
    //   return new FailureWrapper("Order creation failed");
    // }
  };

  addOrder = (
    addOrderRequestDTO: AddOrderRequestDTO
  ): Promise<OrderDTO | FailureWrapper> => {
    const uuid: string = generateUUID();
    return this.producerProxy
      .produceAndWaitForResponse<OrderDTO>(
        "order-creation-requested",
        addOrderRequestDTO,
        uuid
      )
      .then(this.requestBudgetAvailability)
      .catch(this.handleRequestOrderCreationFailure);
  };

  modifyOrderStatus = async (
    modifyOrderStatusRequestDTO: ModifyOrderStatusRequestDTO
  ): Promise<OrderDTO> => {
    const {
      orderId,
      user: { role: userRole },
      newStatus,
    } = modifyOrderStatusRequestDTO;

    if (userRole !== UserRole.ADMIN) throw new UnauthorizedException();

    const order = await this.orderRepository.findOrderById(orderId); // can throw
    if (order === null) {
      Logger.dev(
        NAMESPACE,
        `modifyOrderStatus(patchOrderRequestDTO: ${modifyOrderStatusRequestDTO}): null`
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
        `modifyOrderStatus(patchOrderRequestDTO: ${modifyOrderStatusRequestDTO}): not allowed`
      );
      throw new NotAllowedException();
    }
  };

  deleteOrder = async (
    deleteOrderRequestDTO: DeleteOrderRequestDTO
  ): Promise<void> => {
    const {
      orderId,
      user: { role: userRole, id: userId },
    } = deleteOrderRequestDTO;

    const order = await this.orderRepository.findOrderById(orderId);
    if (order === null) {
      Logger.dev(
        NAMESPACE,
        `deleteOrder(deleteRequestDTO: ${deleteOrderRequestDTO}): no order`
      );
      throw new OrderNotExistException();
    }

    const orderStatus: OrderStatus = toOrderStatus(order.status!)!;

    if (userRole === UserRole.CUSTOMER && order.buyerId !== userId) {
      Logger.dev(
        NAMESPACE,
        `deleteOrder(deleteRequestDTO: ${deleteOrderRequestDTO}): unauthorized`
      );
      throw new UnauthorizedException();
    }

    if (orderStatus === OrderStatus.CANCELLED)
      throw new OrderAlreadyCancelledException();

    if (orderStatus !== OrderStatus.ISSUED) {
      Logger.dev(
        NAMESPACE,
        `deleteOrder(deleteRequestDTO: ${deleteOrderRequestDTO}): not allowed`
      );
      throw new NotAllowedException();
    }

    order.status = toOrderStatusName(OrderStatus.CANCELLED);
    const cancelledOrder = await this.orderRepository.save(order);
    Logger.dev(
      NAMESPACE,
      `deleteOrder(deleteRequestDTO: ${deleteOrderRequestDTO}): ${cancelledOrder}`
    );

    return this.producerProxy.producer
      .produce({
        topic: "order-cancelled",
        messages: [{ key: orderId, value: JSON.stringify(cancelledOrder) }], // TODO: right way?}
      })
      .then(() => {});
  };
}
