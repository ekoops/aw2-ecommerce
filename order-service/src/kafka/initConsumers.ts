import KafkaProxy from "./KafkaProxy";
import ConsumerProxy, { ExceptionBuilder } from "./ConsumerProxy";
import { ApprovationDTO } from "../dtos/ApprovationDTO";
import config from "../config/config";
import { OrderDTO } from "../domain/Order";
import {
  ItemsNotAvailableException,
  NotEnoughBudgetException,
  WalletOrderCreationFailedException,
  WarehouseOrderCreationFailedException,
} from "../exceptions/kafka/communication/application/ApplicationException";
import Logger from "../utils/Logger";

const NAMESPACE = "INIT_CONSUMERS";

const initConsumers = async (kafkaProxy: KafkaProxy) => {
  const { groupId } = config.kafka;

  const startConsumer = async <SuccessResponseType>({
    groupId,
    topic,
    exceptionBuilder,
  }: {
    groupId: string;
    topic: string;
    exceptionBuilder: ExceptionBuilder;
  }) => {
    const topics = [{ topic }];
    const consumer = await kafkaProxy.createConsumer(groupId, topics);
    const consumerProxy = new ConsumerProxy(consumer);
    return consumerProxy.bindHandlers<SuccessResponseType>(exceptionBuilder);
  };

  const consumersHandles = [
    startConsumer<OrderDTO>({
      groupId: groupId + "_1",
      topic: "order-items-availability-produced",
      exceptionBuilder: ItemsNotAvailableException.fromJson,
    }),

    startConsumer<OrderDTO>({
      groupId: groupId + "_2",
      topic: "budget-availability-produced",
      exceptionBuilder: NotEnoughBudgetException.fromJson,
    }),

    // COUPLED CONSUMERS
    startConsumer<ApprovationDTO>({
      groupId: groupId + "_3",
      topic: "order-creation-warehouse-response",
      exceptionBuilder: WarehouseOrderCreationFailedException.fromJson,
    }),
    startConsumer<ApprovationDTO>({
      groupId: groupId + "_4",
      topic: "order-creation-wallet-response",
      exceptionBuilder: WalletOrderCreationFailedException.fromJson,
    }),
  ];

  // only CannotCreateConsumerException can be throw
  await Promise.all(consumersHandles);
  Logger.dev(NAMESPACE, "all consumers have been initialized");
};

export default initConsumers;
