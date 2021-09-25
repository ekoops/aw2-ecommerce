import OrderRepository from "../repositories/OrderRepository";
import { Order, OrderDTO } from "../domain/Order";
import { OrderStatus } from "../domain/OrderStatus";
import FailureWrapper from "./FailureWrapper";
import ProducerProxy from "../kafka/ProducerProxy";
import { generateUUID } from "../utils/utils";
import RequestStore, {
  FailurePayload,
  SuccessPayload,
} from "../kafka/RequestStore";
import { ApprovationDTO, Approver, toApprover } from "../dtos/ApproverDTO";
import Logger from "../utils/Logger";
import {
  NotAllowedException,
  UnauthorizedException,
} from "../exceptions/AuthException";
import {
  OrderAlreadyCancelledException,
  OrderNotExistException,
} from "../exceptions/services/OrderServiceException";
import OrderUtility from "../utils/OrderUtility";
import { CommunicationException } from "../exceptions/kafka/communication/CommunicationException";
import GetOrdersRequestDTO from "../dtos/GetOrdersRequestDTO";
import { UserRole } from "../domain/User";
import GetOrderRequestDTO from "../dtos/GetOrderRequestDTO";
import CreateOrderRequestDTO from "../dtos/CreateOrderRequestDTO";
import ModifyOrderStatusRequestDTO from "../dtos/ModifyOrderStatusRequestDTO";
import CancelOrderRequestDTO from "../dtos/CancelOrderRequestDTO";
import OrderStatusUtility from "../utils/OrderStatusUtility";

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

  /*
   * This service method returns all user's orders if the user is a CUSTOMER,
   * otherwise, if the user is an ADMIN, it returns all stored orders
   */
  getOrders = async (
    getOrdersRequestDTO: GetOrdersRequestDTO
  ): Promise<OrderDTO[]> => {
    Logger.dev(
      NAMESPACE,
      "request for service: getOrders(user: _)...",
      getOrdersRequestDTO
    );

    const { role: userRole, id: userId } = getOrdersRequestDTO;

    const orders = await (userRole === UserRole.CUSTOMER
      ? this.orderRepository.findUserOrders(userId)
      : this.orderRepository.findOrders());
    const ordersDTO = orders.map(OrderUtility.toOrderDTO);
    Logger.dev(NAMESPACE, "getOrders(): _", ordersDTO);

    return ordersDTO;
  };

  /*
   * If the user is an ADMIN, this service method returns the order with the
   * specified id (or null if it not exist). If the user is a CUSTOMER, this service
   * method returns the order with the specified id only if the user is the owner.
   */
  getOrder = async (
    getOrderRequestDTO: GetOrderRequestDTO
  ): Promise<OrderDTO | null> => {
    Logger.dev(
        NAMESPACE,
        "request for service: getOrder(getOrderRequestDTO: _...",
        getOrderRequestDTO
    );

    const {
      orderId,
      user: { role: userRole, id: userId },
    } = getOrderRequestDTO;

    const order = await (userRole === UserRole.CUSTOMER
      ? this.orderRepository.findUserOrderById(userId, orderId)
      : this.orderRepository.findOrderById(orderId));
    const orderDTO = order !== null ? OrderUtility.toOrderDTO(order) : null;
    Logger.dev(
      NAMESPACE,
      "getOrder(getOrderRequestDTO: _): _",
      getOrderRequestDTO,
      orderDTO
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
          order.status = OrderStatusUtility.toOrderStatusName(
            OrderStatus.ISSUED
          );
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
    const { value: orderDTO } = message;

    // preparing order object
    const transientOrder: Order | null = OrderUtility.buildOrder(orderDTO);
    if (!transientOrder) return new FailureWrapper("Order creation failed");

    // persisting order object
    let persistedOrder: Order;
    try {
      persistedOrder = await this.orderRepository.createOrder(transientOrder);
    } catch (ex) {
      // The exception can only be of type OrderCreationFailedException
      Logger.dev(
        NAMESPACE,
        `approveOrder(err: ${(ex as FailurePayload).constructor.name})`
      );
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
        `createOrder(response error: ${
          (ex as FailurePayload).constructor.name
        })`
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
        "modifyOrderStatus(patchOrderRequestDTO: _): null",
        modifyOrderStatusRequestDTO
      );
      throw new OrderNotExistException();
    }

    const actualStatus: OrderStatus = OrderStatusUtility.toOrderStatus(
      order.status!
    )!;
    if (
      (actualStatus === OrderStatus.ISSUED &&
        (newStatus === OrderStatus.DELIVERING ||
          newStatus === OrderStatus.FAILED)) ||
      (actualStatus === OrderStatus.DELIVERING &&
        (newStatus === OrderStatus.DELIVERED ||
          newStatus === OrderStatus.FAILED))
    ) {
      order.status = OrderStatusUtility.toOrderStatusName(newStatus);
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
        `modifyOrderStatus(patchOrderRequestDTO: _): not allowed`,
        modifyOrderStatusRequestDTO
      );
      throw new NotAllowedException();
    }
  };

  cancelOrder = async (
    cancelOrderRequestDTO: CancelOrderRequestDTO
  ): Promise<void> => {
    Logger.dev(
        NAMESPACE,
        "request for service: cancelOrder(cancelRequestDTO: _...",
        cancelOrderRequestDTO
    );

    const {
      orderId,
      user: { role: userRole, id: userId },
    } = cancelOrderRequestDTO;

    const order = await (userRole === UserRole.CUSTOMER
        ? this.orderRepository.findUserOrderById(userId, orderId)
        : this.orderRepository.findOrderById(orderId));
    if (order === null) {
      Logger.dev(
        NAMESPACE,
        "cancelOrder(cancelOrderRequestDTO: _): no order",
        cancelOrderRequestDTO
      );
      throw new OrderNotExistException();
    }

    const orderStatus: OrderStatus = OrderStatusUtility.toOrderStatus(
      order.status
    )!;

    if (orderStatus === OrderStatus.CANCELLED)
      throw new OrderAlreadyCancelledException();

    if (orderStatus !== OrderStatus.ISSUED) {
      Logger.dev(
        NAMESPACE,
        "cancelOrder(cancelOrderRequestDTO: _): not allowed",
        cancelOrderRequestDTO
      );
      throw new NotAllowedException();
    }

    order.status = OrderStatusUtility.toOrderStatusName(OrderStatus.CANCELLED);
    const cancelledOrder = await this.orderRepository.save(order);
    Logger.dev(
      NAMESPACE,
      "cancelOrder(cancelOrderRequestDTO: _): _",
      cancelOrderRequestDTO,
      cancelledOrder
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
