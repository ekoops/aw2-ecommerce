import { Consumer } from "./KafkaProxy";
import {
  KafkaException,
  NoValueException,
  ValueParsingFailedException,
} from "../exceptions/kafka/kafka-exceptions";
import Logger from "../utils/Logger";

const NAMESPACE = "CONSUMER";

export default class ConsumerProxy {
  constructor(private consumer: Consumer) {}

  bindHandlers<SuccessResponseType>(
    // onSuccessFallback: (payload: SuccessPayload) => any,
    successHandler: Function,
    failureHandler: (ex: KafkaException) => any
  ) {
    return this.consumer.consume(async ({ message }) => {
      const key = message.key.toString();
      if (key === undefined) {
        Logger.error(NAMESPACE, "undefined key");
        return;
      }

      const value = message.value?.toString();
      if (value === undefined) {
        Logger.error(NAMESPACE, "undefined value");
        return failureHandler(new NoValueException(key));
      }

      let obj;
      try {
        obj = JSON.parse(value);
      } catch (ex) {
        Logger.error(NAMESPACE, "value parsing failed");
        return failureHandler(new ValueParsingFailedException(key));
      }
      Logger.dev(NAMESPACE, `key: ${key} - value: ${JSON.stringify(obj)}`);
      successHandler({key, value: obj as SuccessResponseType});
    });
  }
}
