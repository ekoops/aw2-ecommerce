import OrderRepository from "../repositories/OrderRepository";
import { Order, OrderDTO } from "../models/Order";
import {
  OrderStatus,
  toOrderStatus,
  toOrderStatusName,
} from "../db/OrderStatus";
import FailureWrapper from "./FailureWrapper";
import ProducerProxy from "../kafka/ProducerProxy";
import { force, generateUUID } from "../utils/utils";
import RequestStore, {
  FailurePayload,
  SuccessPayload,
} from "../kafka/RequestStore";
import {
  CreateOrderRequestDTO,
  ApprovationDTO,
  Approver,
  DeleteOrderRequestDTO,
  GetOrderRequestDTO,
  GetOrdersRequestDTO,
  ModifyOrderStatusRequestDTO,
  toApprover,
  UserRole,
} from "../dtos/DTOs";
import Logger from "../utils/Logger";
import {
  NotAllowedException,
  UnauthorizedException,
} from "../exceptions/AuthException";
import { CannotProduceException } from "../exceptions/kafka/communication/ProducerException";
import {
  OrderAlreadyCancelledException,
  OrderNotExistException,
} from "../exceptions/services/OrderServiceException";
import OrderUtility from "../utils/OrderUtility";
import { CommunicationException } from "../exceptions/kafka/communication/CommunicationException";

const NAMESPACE = "ORDER_SERVICE";

const requestStore = RequestStore.getInstance();

export default class OrderService {
  private static _instance: OrderService;

  private constructor(
    private orderRepository: OrderRepository,
    private producerProxy: ProducerProxy
  ) {}

  static getInstance(
    orderRepository: OrderRepository,
    producerProxy: ProducerProxy
  ) {
    return (
      this._instance ||
      (this._instance = new this(orderRepository, producerProxy))
    );
  }

  getOrders = async (
    getOrdersRequestDTO: GetOrdersRequestDTO
  ): Promise<OrderDTO[]> => {
    const { role: userRole, id: userId } = getOrdersRequestDTO;

    const buyerId = userRole === UserRole.CUSTOMER ? userId : undefined;
    const orders = await this.orderRepository.findOrders(buyerId); // can throw
    const ordersDTO = orders.map(OrderUtility.toOrderDTO);
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
    const orderDTO = OrderUtility.toOrderDTO(order);
    Logger.dev(
      NAMESPACE,
      `getOrder(getOrderRequestDTO: ${getOrderRequestDTO}): ${orderDTO}`
    );
    return orderDTO;
  };

  handleApprovation = async (message: {
    key: string;
    value: ApprovationDTO;
  }): Promise<OrderDTO | FailureWrapper> => {
    const {
      key: transactionId,
      value: { approverName, orderDTO },
    } = message;

    const FAILURE_OBJ = new FailureWrapper("Order creation failed");

    // the orderDTO's id must be present and it has to be equal to
    // the transactionId. In case of mismatch, it is not safe to trying to
    // delete an order with id === transactionId or id === orderDTO.id, so
    // I simply return FAILURE_OBJ
    if (orderDTO.id === undefined || orderDTO.id !== transactionId)
      return FAILURE_OBJ;
    const orderId = orderDTO.id;

    const failureHandler = this.handleApproveOrderFailure.bind(
      this,
      new CommunicationException(orderId)
    );

    // obtaining approver info
    const approver = toApprover(approverName);
    if (approver === undefined) return failureHandler();

    // getting order
    let order: Order | null = null;
    try {
      order = await this.orderRepository.findOrderById(orderId);
      if (order === null) return FAILURE_OBJ;
    } catch (ex) {
      return failureHandler();
    }

    let updated = false;
    if (approver === Approver.WALLET) {
      if (!order.walletHasApproved) {
        updated = true;
        order.walletHasApproved = true;
      }
    } else {
      if (!order.warehouseHasApproved) {
        updated = true;
        order.warehouseHasApproved = true;
        const areAssigned = OrderUtility.assignSources(order, orderDTO);
        if (!areAssigned) return failureHandler();
      }
    }

    if (updated) {
      try {
        if (order.walletHasApproved && order.warehouseHasApproved) {
          order.status = toOrderStatusName(OrderStatus.ISSUED);
          const issuedOrder = await this.orderRepository.save(order);
          return OrderUtility.toOrderDTO(issuedOrder);
        }
        await this.orderRepository.save(order);
      } catch (ex) {
        // trying to delete order. It doesn't matter if it is not possibile
        // to delete the order since the job will be done by a worker
        return failureHandler();
      }
    }
    return new Promise<{ key: string; value: ApprovationDTO }>(
      (resolve, reject) => {
        requestStore.set(orderId, resolve, reject);
      }
    )
      .then(this.handleApprovation)
      .catch(this.handleApproveOrderFailure);
  };

  handleApproveOrderFailure = async (
    err: FailurePayload
  ): Promise<FailureWrapper> => {
    Logger.dev(
      NAMESPACE,
      `handleApproveOrderFailure(err: ${err.constructor.name})`
    );
    this.orderRepository.deleteOrderById(err.transactionId).catch((ex) => {
      Logger.dev(
        NAMESPACE,
        `handleApproveOrderFailure(err: ${ex.constructor.name})`
      );
    });

    return new FailureWrapper("Order creation failed");
  };

  approveOrder = async (
    message: SuccessPayload
  ): Promise<OrderDTO | FailureWrapper> => {
    const { key: transactionId, value: orderDTO } = message;

    // preparing order object
    const transientOrder: Order | null = OrderUtility.buildOrder(orderDTO);
    if (!transientOrder) return new FailureWrapper("Order creation failed");

    // persisting order object
    let persistedOrder: Order;
    try {
      persistedOrder = await this.orderRepository.createOrder(transientOrder);
    } catch (ex) {
      // The exception can only be of type OrderCreationFailedException
      Logger.dev(NAMESPACE, `approveOrder(err: ${ex.constructor.name})`);
      return new FailureWrapper("Order creation failed");
    }

    const persistedOrderDTO = OrderUtility.toOrderDTO(persistedOrder);
    return this.producerProxy
      .produceAndWaitResponse<ApprovationDTO>(
        "order-approved",
        persistedOrderDTO.id!,
        persistedOrderDTO
      )
      .then(this.handleApprovation)
      .catch(this.handleApproveOrderFailure);
  };

  createOrder = async (
    createOrderRequestDTO: CreateOrderRequestDTO
  ): Promise<OrderDTO | FailureWrapper> => {
    const transactionId: string = generateUUID();
    try {
      // checking items availability. The response is an orderDTO
      // containing price for each product in the order.
      const itemsAvailabilityResponse =
        await this.producerProxy.produceAndWaitResponse<OrderDTO>(
          "items-availability-requested",
          transactionId,
          createOrderRequestDTO
        );
      const orderDTO = itemsAvailabilityResponse.value;

      const arePricesMissing = orderDTO.items.some(
        (item) => item.perItemPrice === undefined
      );
      if (arePricesMissing) return new FailureWrapper("Order creation failed");

      // checking buyer budget availability
      const budgetAvailabilityResponse =
        await this.producerProxy.produceAndWaitResponse<OrderDTO>(
          "budget-availability-requested",
          transactionId,
          orderDTO
        );
      return this.approveOrder(budgetAvailabilityResponse);
    } catch (ex) {
      Logger.dev(
        NAMESPACE,
        `createOrder(response error: ${ex.constructor.name})`
      );
      return new FailureWrapper("Order creation failed");
    }
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
      const updatedOrderDTO = OrderUtility.toOrderDTO(updatedOrder);
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

    try {
      await this.producerProxy.producer.produce({
        topic: "order-cancelled",
        messages: [{ key: orderId, value: JSON.stringify(cancelledOrder) }], // TODO: right way?}
      });
    } catch (ex) {
      // the only exception that can be thrown is of type CannotProduceException;
      // TODO: and now?
    }
  };
}
