import OrderRepository from "../repositories/OrderRepository";
import { Order, OrderDTO } from "../domain/Order";
import { OrderStatus } from "../domain/OrderStatus";
import OrderCreationFailed from "../domain/OrderCreationFailed";
import ProducerProxy from "../kafka/ProducerProxy";
import { generateUUID } from "../utils/utils";
import RequestStore, {
  FailurePayload,
  SuccessPayload,
} from "../kafka/RequestStore";
import { ApprovationDTO } from "../dtos/ApprovationDTO";
import Logger from "../utils/Logger";
import {
  NotAllowedException,
  UnauthorizedException,
} from "../exceptions/AuthException";
import {
  OrderAlreadyCancelledException,
  OrderNotFoundException,
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
import ApproverUtility from "../utils/ApproverUtility";
import Approver from "../domain/Approver";

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
      "request for service: getOrders(user: %v)...",
      getOrdersRequestDTO
    );

    const { role: userRole, id: userId } = getOrdersRequestDTO;

    const orders = await (userRole === UserRole.CUSTOMER
      ? this.orderRepository.findUserOrders(userId)
      : this.orderRepository.findOrders());
    const ordersDTO = orders.map(OrderUtility.toOrderDTO);
    Logger.dev(NAMESPACE, "getOrders(): %v", ordersDTO);

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
      "request for service: getOrder(getOrderRequestDTO: %v...",
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
      "getOrder(getOrderRequestDTO: %v): %v",
      getOrderRequestDTO,
      orderDTO
    );
    return orderDTO;
  };

  handleApprovation = async (message: {
    key: string;
    value: ApprovationDTO;
  }): Promise<OrderDTO | OrderCreationFailed> => {
    const {
      key: transactionId,
      value: { approverName, orderDTO },
    } = message;

    const FAILURE_OBJ = new OrderCreationFailed();

    // the orderDTO's id must be present and it has to be equal to
    // the transactionId. In case of mismatch, it is not safe to trying to
    // delete an order with id === transactionId or id === orderDTO.id, so
    // I simply return FAILURE_OBJ
    if (orderDTO.id === undefined || orderDTO.id !== transactionId)
      return FAILURE_OBJ;
    const orderId = orderDTO.id;

    // preparing a failureHandler that can be used in case of error
    const failureHandler = this.handleApproveOrderFailure.bind(
      this,
      new CommunicationException(orderId)
    );

    // obtaining approver info
    const approver = ApproverUtility.toApprover(approverName);
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
          // ORDER CREATED SUCCESSFULLY
          return OrderUtility.toOrderDTO(issuedOrder);
        }
        await this.orderRepository.save(order);
      } catch (ex) {
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
  ): Promise<OrderCreationFailed> => {
    Logger.dev(
      NAMESPACE,
      `handleApproveOrderFailure(err: ${err.constructor.name})`
    );
    // trying to delete order. It doesn't matter if it is not possible
    // to delete the order since the job will be done by the cleaner
    this.orderRepository.deleteOrderById(err.transactionId).catch((() => {/* doing nothing... */}));

    return new OrderCreationFailed();
  };

  approveOrder = async (
    message: SuccessPayload
  ): Promise<OrderDTO | OrderCreationFailed> => {
    const { value: orderDTO } = message;

    // preparing order object
    const transientOrder: Order | null = OrderUtility.buildOrder(orderDTO);
    if (!transientOrder) return new OrderCreationFailed();

    try {
      // persisting order object
      // After the order creation, debezium will publish on the proper topic
      // the creation event and both the warehouse service and the wallet service
      // have to listen to this topic and perform the right action in order to
      // finalize the order creation (such as subtract the right amount of products
      // from warehouses and subtract the right amount of money from the customer wallet).
      const persistedOrder: Order = await this.orderRepository.createOrder(
        transientOrder
      );

      // Waiting for warehouse service and wallet service approvations.
      return new Promise<{ key: string; value: ApprovationDTO }>(
        (resolve, reject) => {
          const orderId = persistedOrder._id!; // the order id must be present after the create operation
          requestStore.set(orderId, resolve, reject);
        }
      )
        .then(this.handleApprovation)
        .catch(this.handleApproveOrderFailure);
    } catch (ex) {
      // The exception can only be of type OrderCreationFailedException
      Logger.dev(
        NAMESPACE,
        `approveOrder(err: ${(ex as FailurePayload).constructor.name})`
      );
      return new OrderCreationFailed();
    }
  };

  createOrder = async (
    createOrderRequestDTO: CreateOrderRequestDTO
  ): Promise<OrderDTO | OrderCreationFailed> => {
    const transactionId: string = generateUUID();
    try {
      // checking items availability. The response is an orderDTO
      // containing price for each product in the order.
      const itemsAvailabilityResponse =
        await this.producerProxy.produceAndWaitResponse<OrderDTO>(
          "order-items-availability-requested",
          transactionId,
          createOrderRequestDTO
        );
      const orderDTO = itemsAvailabilityResponse.value;

      // checking if there is some item without an associated price
      const arePricesMissing = orderDTO.items.some(
        (item) => item.perItemPrice === undefined
      );
      if (arePricesMissing) return new OrderCreationFailed();

      // checking buyer budget availability. The response must have
      // key = transactionId and value = orderDTO without any modification.
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
      return new OrderCreationFailed();
    }
  };

  private isStatusChangeAllowed = (
    oldStatus: OrderStatus,
    newStatus: OrderStatus
  ): boolean => {
    return (
      (oldStatus === OrderStatus.ISSUED &&
        (newStatus === OrderStatus.DELIVERING ||
          newStatus === OrderStatus.FAILED)) ||
      (oldStatus === OrderStatus.DELIVERING &&
        (newStatus === OrderStatus.DELIVERED ||
          newStatus === OrderStatus.FAILED))
    );
  };

  modifyOrderStatus = async (
    modifyOrderStatusRequestDTO: ModifyOrderStatusRequestDTO
  ): Promise<OrderDTO> => {
    Logger.dev(
      NAMESPACE,
      "request for service: modifyOrderStatus(modifyOrderStatusRequestDTO: %v...",
      modifyOrderStatusRequestDTO
    );

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
        "modifyOrderStatus(modifyOrderStatusRequestDTO: %v): null",
        modifyOrderStatusRequestDTO
      );
      throw new OrderNotFoundException();
    }

    const actualStatus = OrderStatusUtility.toOrderStatus(order.status)!;

    if (this.isStatusChangeAllowed(actualStatus, newStatus)) {
      order.status = OrderStatusUtility.toOrderStatusName(newStatus);
      const updatedOrder = await this.orderRepository.save(order); // can throw
      const updatedOrderDTO = OrderUtility.toOrderDTO(updatedOrder);
      Logger.dev(
        NAMESPACE,
        "modifyOrderStatus(modifyOrderStatusRequestDTO: %v): %v",
        modifyOrderStatusRequestDTO,
        updatedOrderDTO
      );
      return updatedOrderDTO;
    } else {
      Logger.dev(
        NAMESPACE,
        "modifyOrderStatus(patchOrderRequestDTO: %v): not allowed",
        modifyOrderStatusRequestDTO
      );
      throw new NotAllowedException();
    }
  };

  deleteOrder = async (
    deleteOrderRequestDTO: CancelOrderRequestDTO
  ): Promise<void> => {
    Logger.dev(
      NAMESPACE,
      "request for service: deleteOrder(deleteOrderRequestDTO: %v...",
      deleteOrderRequestDTO
    );

    const {
      orderId,
      user: { role: userRole, id: userId },
    } = deleteOrderRequestDTO;

    const order = await (userRole === UserRole.CUSTOMER
      ? this.orderRepository.findUserOrderById(userId, orderId)
      : this.orderRepository.findOrderById(orderId));
    if (order === null) {
      Logger.dev(
        NAMESPACE,
        "deleteOrder(deleteOrderRequestDTO: %v): no order or order already cancelled",
        deleteOrderRequestDTO
      );
      return;
    }

    const orderStatus = OrderStatusUtility.toOrderStatus(order.status)!;

    if (orderStatus !== OrderStatus.ISSUED) {
      Logger.dev(
        NAMESPACE,
        "deleteOrder(deleteOrderRequestDTO: %v): not allowed",
        deleteOrderRequestDTO
      );
      throw new NotAllowedException();
    }

    await this.orderRepository.deleteOrderById(order._id!);
  };
}
