import KafkaProxy from "./KafkaProxy";
import ConsumerProxy, { ExceptionBuilder } from "./ConsumerProxy";
import config from "../config/config";
import { OrderDTO } from "../dtos/OrderDTO";
import OrderService from "../services/OrderService";

const initConsumers = async (
  kafkaProxy: KafkaProxy,
  orderService: OrderService
) => {
  const { groupId } = config.kafka;

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
    return consumerProxy.bindHandlers<SuccessResponseType>(exceptionBuilder);
  };

  {
    const topics = [{ topic: "items-availability-requested" }];
    const consumer = await kafkaProxy.createConsumer(groupId, topics);
    const consumerProxy = new ConsumerProxy(consumer);
    consumerProxy.bindHandler<OrderDTO>(
      orderService.checkProductsAvailability
    );
  }
  {
    const topics = [{ topic: "order-db.order-db.orders" }];
    const consumer = await kafkaProxy.createConsumer(groupId, topics, {autoCommitThreshold: 1});
    const consumerProxy = new ConsumerProxy(consumer);
    consumerProxy.bindHandler<OrderDTO>(
        orderService.handleOrderCRUD // this handler has to handle all order crud operations
    );
  }

  // only CannotCreateConsumerException can be throw
  return Promise.all(consumersHandles);
};

export default initConsumers;
