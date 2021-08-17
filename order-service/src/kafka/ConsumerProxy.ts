import { Consumer } from "./KafkaProxy";
import {
    KafkaException, NoHandlersException,
    NoValueException,
    ValueParsingFailedException,
} from "../exceptions/kafka/kafka-exceptions";
import RequestStore from "./RequestStore";

export type ExceptionBuilder = (...args: any) => KafkaException;

const requestStore = RequestStore.getInstance();

export default class ConsumerProxy {
  constructor(private consumer: Consumer) {}

  bindHandlers<SuccessResponseType>(
    // onSuccessFallback: (payload: SuccessPayload) => any,
    failureHandler: (ex: KafkaException) => any,
    exceptionBuilder: ExceptionBuilder
  ) {
    return this.consumer
      .consume(async ({ message }) => {
        const key = message.key.toString();
        if (key === undefined) return;

        const handlers = requestStore.getRequestHandlers(key);
        if (handlers === undefined) return failureHandler(new NoHandlersException());
        const [resolve, reject] = handlers;

        const value = message.value?.toString();
        if (value === undefined) return reject(new NoValueException(key));

        let obj;
        try {
          obj = JSON.parse(value);
        } catch (ex) {
          return reject(new ValueParsingFailedException(key));
        }
        if ("failure" in obj) {
            return reject(exceptionBuilder(key, obj.failure));
        }
        if ("ok" in obj) {
          return resolve({ key, value: obj.ok as SuccessResponseType });
        }
      });
  }
}
