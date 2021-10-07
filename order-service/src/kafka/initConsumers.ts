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
import RequestStore from "./RequestStore";
import { ValueParsingFailedException } from "../exceptions/kafka/communication/ConsumerException";

const initConsumers = async (kafkaProxy: KafkaProxy) => {
  const {groupId} = config.kafka;
  const requestStore = RequestStore.getInstance();
  const arr = [];

  await (async () => {
    const topic = "order-items-availability-produced";
    const topics = [{ topic: topic }]
    const consumer = await kafkaProxy.createConsumer(groupId+"_1", topics);
    await consumer.consume(async (key: string, value: string|undefined) => {
      console.log('@#@#@#@#@#@@#@@@ Received: ', key, value);
      const [resolve, reject] = requestStore.get(key)!;
      console.log('Found resolver: ', !!resolve);
      let obj;
      try {
        obj = JSON.parse(value as string);
      } catch (ex) {
        return reject(new ValueParsingFailedException(key));
      }
      console.log('Resolvign with ', obj.ok);
      return resolve({ key, value: obj.ok as OrderDTO });
    });
  })();


  await (async () => {
    const topic = "budget-availability-produced";
    const topics = [{ topic: topic }]
    const consumer = await kafkaProxy.createConsumer(groupId+"_2", topics);
    await consumer.consume(async (key: string, value: string|undefined) => {
      console.log('@#@#@#@#@#@@#@@@ Received: ', key, value);
      const [resolve, reject] = requestStore.get(key)!;
      console.log('Found resolver: ', !!resolve);
      let obj;
      try {
        obj = JSON.parse(value as string);
      } catch (ex) {
        return reject(new ValueParsingFailedException(key));
      }
      console.log('Resolvign with ', obj.ok);
      return resolve({ key, value: obj.ok as OrderDTO });
    });
  })();

  console.log('!!!!!!! topic consumers inited !!!!!!!');
//
//   const startConsumer = async <SuccessResponseType>({
//     topic,
//     exceptionBuilder,
//   }: {
//     topic: string;
//     exceptionBuilder: ExceptionBuilder;
//   }) => {
//     const topics = [{ topic }];
//     console.log('Creating consumer for topic ', topic)
//     const consumer = await kafkaProxy.createConsumer(groupId, topics);
//     const consumerProxy = new ConsumerProxy(consumer);
//     return consumerProxy.bindHandlers<SuccessResponseType>(
//       exceptionBuilder
//     );
//   };
//
//   const consumersHandles = [
//     startConsumer<OrderDTO>({
//       topic: "order-items-availability-produced",
//       exceptionBuilder: ItemsNotAvailableException.fromJson,
//     }),
//
//     startConsumer<OrderDTO>({
//       topic: "budget-availability-produced",
//       exceptionBuilder: NotEnoughBudgetException.fromJson,
//     }),
//
//     // COUPLED CONSUMERS
//     startConsumer<ApprovationDTO>({
//       topic: "order-creation-warehouse-response",
//       exceptionBuilder: WarehouseOrderCreationFailedException.fromJson,
//     }),
//     startConsumer<ApprovationDTO>({
//       topic: "order-creation-wallet-response",
//       exceptionBuilder: WalletOrderCreationFailedException.fromJson,
//     }),
//   ];
//
//   // only CannotCreateConsumerException can be throw
//   return Promise.all(consumersHandles)
};

export default initConsumers;
