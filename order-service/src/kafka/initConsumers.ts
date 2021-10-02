import KafkaProxy from "./KafkaProxy";
import ConsumerProxy, { ExceptionBuilder } from "./ConsumerProxy";
import { ApprovationDTO } from "../dtos/ApprovationDTO";
import config from "../config/config";
import {OrderDTO} from "../domain/Order";
import {
  ItemsNotAvailableException,
  NotEnoughBudgetException, WalletOrderCreationFailedException,
  WarehouseOrderCreationFailedException
} from "../exceptions/kafka/communication/application/ApplicationException";

const initConsumers = (kafkaProxy: KafkaProxy) => {
  const {groupId} = config.kafka;

  const startConsumer = async <SuccessResponseType>({
    topic,
    exceptionBuilder,
  }: {
    topic: string;
    exceptionBuilder: ExceptionBuilder;
  }) => {
    const topics = [{ topic }];
    const consumer = await kafkaProxy.createConsumer(groupId, topics);
    const consumerProxy = new ConsumerProxy(consumer);
    return consumerProxy.bindHandlers<SuccessResponseType>(
      exceptionBuilder
    );
  };

  const consumersHandles = [
    startConsumer<OrderDTO>({
      topic: "order-items-availability-produced",
      exceptionBuilder: ItemsNotAvailableException.fromJson,
    }),

    startConsumer<OrderDTO>({
      topic: "budget-availability-produced",
      exceptionBuilder: NotEnoughBudgetException.fromJson,
    }),

    // COUPLED CONSUMERS
    startConsumer<ApprovationDTO>({
      topic: "order-creation-warehouse-response",
      exceptionBuilder: WarehouseOrderCreationFailedException.fromJson,
    }),
    startConsumer<ApprovationDTO>({
      topic: "order-creation-wallet-response",
      exceptionBuilder: WalletOrderCreationFailedException.fromJson,
    }),
  ];

  // only CannotCreateConsumerException can be throw
  return Promise.all(consumersHandles)
};

export default initConsumers;
