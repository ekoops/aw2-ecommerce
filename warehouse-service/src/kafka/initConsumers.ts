import KafkaProxy from "./KafkaProxy";
import ConsumerProxy, { ExceptionBuilder } from "./ConsumerProxy";
import config from "../config/config";
import {OrderDTO} from "../domain/Order";
import OrderController from "../controllers/OrderController";

const initConsumers = async (
  kafkaProxy: KafkaProxy,
  orderController: OrderController
) => {
  const { groupId } = config.kafka;

  // const startConsumer = async <SuccessResponseType>({
  //   topic,
  //   exceptionBuilder,
  // }: {
  //   topic: string;
  //   exceptionBuilder: ExceptionBuilder;
  // }) => {
  //   const topics = [{ topic }];
  //   const consumer = await kafkaProxy.createConsumer(groupId, topics);
  //   const consumerProxy = new ConsumerProxy(consumer);
  //   return consumerProxy.bindHandlers<SuccessResponseType>(exceptionBuilder);
  // };

  const consumerHandlers: Promise<any>[] = []
  {
    const topics = [{ topic: "order-items-availability-requested" }];
    const consumer = await kafkaProxy.createConsumer(groupId, topics);
    // const consumerProxy = new ConsumerProxy(consumer);
    // consumerHandlers.push(consumerProxy.bindHandler<OrderDTO>(
    //   orderController.checkProductsAvailability
    // ));
    console.log('@!@@@@@@@@@@ order-items-availability-requested')
    consumerHandlers.push(consumer.consume(async (key: string, val: string|undefined) => {
      console.log('Receiving request: ', key, val)
      orderController.checkProductsAvailability(key, val);
    }))
   }
  // {
  //   const topics = [{ topic: "order-db.order-db.orders" }];
  //   const consumer = await kafkaProxy.createConsumer(groupId, topics, {autoCommitThreshold: 1});
  //   consumerHandlers.push(consumer.consume(orderController.handleOrderCRUD));
  // }

  // only CannotCreateConsumerException can be thrown
  return Promise.all(consumerHandlers);
};

export default initConsumers;
