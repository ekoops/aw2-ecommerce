import KafkaProxy from "./KafkaProxy";
import {
  CannotCreateConsumerException,
  HandlersBindingFailedException,
  KafkaException,
} from "../exceptions/kafka/kafka-exceptions";
import ConsumerProxy from "./ConsumerProxy";
import { UserCreatedDTO } from "../dtos/UserCreatedDTO";
import MailService from "../services/MailService";

const initConsumers = (kafkaProxy: KafkaProxy, mailService: MailService) => {
  const groupId = "mail-svc-grp";

  let i = 0;
  const startConsumer = async <SuccessResponseType>({
    topic,
    successHandler,
    failureHandler,
  }: {
    topic: string;
    successHandler: Function;
    failureHandler: (ex: KafkaException) => any;
  }) => {
    const topics = [{ topic }];
    const consumer = await kafkaProxy.createConsumer(groupId + `_${++i}`, topics);
    const consumerProxy = new ConsumerProxy(consumer);
    return consumerProxy.bindHandlers<SuccessResponseType>(
      successHandler,
      failureHandler
    );
  };

  const consumersHandles = [
    startConsumer<UserCreatedDTO>({
      topic: "user-created",
      successHandler: mailService.sendVerificationMail.bind(mailService),
      failureHandler: () => {},
    }),
    
    startConsumer<any>({
      topic: "warehouse-threshold",
      successHandler: mailService.sendThresholdMail.bind(mailService),
      failureHandler: () => {},
    }),
  ];

  // TODO
  return Promise.all(consumersHandles).catch((ex) => {
    if (ex instanceof CannotCreateConsumerException) throw ex;
    else throw new HandlersBindingFailedException(ex.toString());
  });
};

export default initConsumers;
