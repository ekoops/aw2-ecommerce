import {
  orderRepository,
  OrderRepositoryNosql,
} from "../repositories/order-repository-nosql";
import { Order, OrderDTO, toOrderDTO } from "../models/Order";
import { OrderStatus, toStatusName } from "../db/OrderStatus";
import {OrderItem, OrderItemDTO, toOrderItem} from "../models/OrderItem";
import AppError from "../models/AppError";
import {
  Consumer,
  createConsumer,
  createProducer,
  Producer,
} from "../kafka/kafka";
import {generateUUID, produceAndWaitForResponse} from "../kafka/async-communication-utils";

const requests: { [key: string]: [Function, Function] } = {};

export class OrderService {
  constructor(
    private orderRepository: OrderRepositoryNosql,
    private producer: Producer,
    private consumer: Consumer
  ) {}

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

  async handleWarehouseAvailabilityResponseSuccess(orderItemDTOs?: OrderItemDTO[]) {
    if (orderItemDTOs)
    const totalOrderAmount = orderItemDTOs.reduce(
        (acc, item) => acc + item.perItemPrice! * item.amount,
        0
    );
    // if the following promise is resolved, the buyer has enough money
    await produceAndWaitForResponse(
        this.producer,
        "wallet-availability-requested",
        {
          buyerId: orderDTO.buyerId,
          totalOrderAmount
        },
        uuid,
    );
  }
  async handleWarehouseAvailabilityResponseFailure() {

  }

  async requestOrderCreation(orderDTO: OrderDTO) {
    let uuid: string = generateUUID();
    produceAndWaitForResponse<OrderItemDTO[]>(
        this.producer,
        "order-creation-requested",
        orderDTO.items,
        uuid,
    ).then(this.handleWarehouseAvailabilityResponseSuccess).catch(err => {
      if (err !instanceof CannotProduceException) {
        this.handleWarehouseAvailabilityResponseFailure()
      }
    });

  }

  async addOrder(orderDTO: OrderDTO): Promise<OrderDTO | AppError> {
    let uuid: string = generateUUID();
    try {
      // The response is produced on the topic: order-items-available
      const orderItemDTOs: OrderItemDTO[] = (await produceAndWaitForResponse(
          this.producer,
          "order-creation-requested",
          orderDTO.items,
          uuid,
      )) as OrderItemDTO[];

      const totalOrderAmount = orderItemDTOs.reduce(
          (acc, item) => acc + item.perItemPrice! * item.amount,
          0
      );
      // if the following promise is resolved, the buyer has enough money
      await produceAndWaitForResponse(
          this.producer,
          "wallet-availability-requested",
          {
            buyerId: orderDTO.buyerId,
            totalOrderAmount
          },
          uuid,
      );
      const orderDTOWithPerItemPrices: OrderDTO = {
        ...orderDTO,
        items: orderItemDTOs
      };

      // if the following promise is resolved, the order can be created
      await produceAndWaitForResponse(
          this.producer,
          "order-approved",
          orderDTOWithPerItemPrices,
          uuid,
      );
      const orderWithPerItemPrices: Order = {
        buyerId: orderDTOWithPerItemPrices.buyerId,
        items: orderItemDTOs.map(toOrderItem)
      };
      const createdOrder = await this.orderRepository.createOrder(orderWithPerItemPrices);
      return toOrderDTO(createdOrder);
    }
    catch (ex) {
      // delete requests[uuid];
      // TODO: logging error
      if (ex instanceof NoProductAvailabilityException) {

      }
      else if (ex instanceof NoEnoughMoneyException) {

      }
      else if (ex instanceof WarehouseFailureException) {

      }
      else if (ex instanceof WalletFailureException) {

      }
      else if (ex instanceof RepositoryException) {

      }
      else {

      }

      return new AppError("No items availability")
    }
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

const getOrderService = async (): Promise<OrderService> => {
  const createProducerPromise = createProducer();
  const createConsumerPromise = createConsumer("groupId");

  const [producer, consumer] = await Promise.all([
    createProducerPromise,
    createConsumerPromise,
  ]);
  return new OrderService(orderRepository, producer, consumer);
};

export default getOrderService;
