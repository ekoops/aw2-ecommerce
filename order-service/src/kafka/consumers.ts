import KafkaProxy  from "./KafkaProxy";
import {ConsumerSubscribeTopic} from "kafkajs";
import {ItemsNotAvailableException} from "../exceptions/kafka/kafka-exceptions";
import {OrderDTO} from "../models/Order";
import {OrderService} from "../services/order-service";
import ConsumerProxy from "./ConsumerProxy";



const initConsumers = async (kafkaProxy: KafkaProxy, orderService: OrderService) => {

  const groupId = "order-svc-grp";
  const topics: ConsumerSubscribeTopic[] = [{topic: "order-item-available"}];

  const orderItemAvailableConsumer = await kafkaProxy.createConsumer(groupId, topics);
  const consumerProxy = new ConsumerProxy(orderItemAvailableConsumer);
  await consumerProxy.bindHandlers<OrderDTO, ItemsNotAvailableException>(
      () => {},
      () => {}
  );
  // TODO

};

export default initConsumers;