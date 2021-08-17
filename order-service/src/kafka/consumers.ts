import KafkaProxy from "./KafkaProxy";
import {
  HandlersBindingFailedException,
  ItemsNotAvailableException,
  NotEnoughBudgetException,
  WalletOrderCreationFailedException,
  WarehouseOrderCreationFailedException,
} from "../exceptions/kafka/kafka-exceptions";
import OrderService from "../services/order-service";
import ConsumerProxy, {ExceptionBuilder} from "./ConsumerProxy";
import { ApprovationDTO, OrderDTO } from "../dtos/DTOs";
import {FailureHandler} from "./RequestStore";

const initConsumers = (
  kafkaProxy: KafkaProxy,
  orderService: OrderService
) => {
  const groupId = "order-svc-grp";

  const startConsumer = async <SuccessResponseType>({
    topic,
    // onSuccessFallback,
    failureHandler,
    exceptionBuilder,
  }: {
    topic: string;
    // onSuccessFallback: (payload: SuccessPayload) => any;
    failureHandler: FailureHandler;
    exceptionBuilder: ExceptionBuilder;
  }) => {
    const topics = [{ topic }];
    const consumer = await kafkaProxy.createConsumer(groupId, topics);
    const consumerProxy = new ConsumerProxy(consumer);
    return consumerProxy.bindHandlers<SuccessResponseType>(
      failureHandler,
      exceptionBuilder
    );
  };

  const consumersHandles = [
    startConsumer<OrderDTO>({
      topic: "order-items-availability-produced",
      // onSuccessFallback: orderService.requestBudgetAvailability,
      failureHandler: orderService.handleRequestOrderCreationFailure,
      exceptionBuilder: ItemsNotAvailableException.fromJson,
    }),

    startConsumer<OrderDTO>({
      topic: "budget-availability-produced",
      // onSuccessFallback: orderService.approveOrder,
      failureHandler: orderService.handleRequestBudgetAvailabilityFailure,
      exceptionBuilder: NotEnoughBudgetException.fromJson,
    }),

    // COUPLED CONSUMER
    startConsumer<ApprovationDTO>({
      topic: "order-approved-by-warehouse",
      // onSuccessFallback: orderService.handleOct,
      failureHandler: orderService.handleApproveOrderFailure,
      exceptionBuilder: WarehouseOrderCreationFailedException.fromJson,
    }),

    startConsumer<ApprovationDTO>({
      topic: "order-approved-by-wallet",
      // onSuccessFallback: orderService.handleOct,
      failureHandler: orderService.handleApproveOrderFailure,
      exceptionBuilder: WalletOrderCreationFailedException.fromJson,
    }),
  ];

  // TODO
  Promise.all(consumersHandles).catch((err) => {
    throw new HandlersBindingFailedException();
  });
};

export default initConsumers;
