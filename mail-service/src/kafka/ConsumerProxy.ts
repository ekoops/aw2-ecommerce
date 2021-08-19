import { Consumer } from "./KafkaProxy";
import {
  KafkaException,
  NoValueException,
  ValueParsingFailedException,
} from "../exceptions/kafka/kafka-exceptions";

export default class ConsumerProxy {
  constructor(private consumer: Consumer) {}

  bindHandlers<SuccessResponseType>(
    // onSuccessFallback: (payload: SuccessPayload) => any,
    successHandler: Function,
    failureHandler: (ex: KafkaException) => any
  ) {
    return this.consumer.consume(async ({ message }) => {
      const key = message.key.toString();
      if (key === undefined) return;

      const value = message.value?.toString();
      if (value === undefined) return failureHandler(new NoValueException(key));

      let obj;
      try {
        obj = JSON.parse(value);
      } catch (ex) {
        return failureHandler(new ValueParsingFailedException(key));
      }
      successHandler(key, obj as SuccessResponseType);
    });
  }
}
