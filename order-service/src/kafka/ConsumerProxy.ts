import { Consumer } from "./KafkaProxy";
import {
  NoValueException,
  ValueParsingFailedException,
} from "../exceptions/kafka/kafka-exceptions";
import { getPromiseHandlers } from "./async-communication-utils";

export default class ConsumerProxy {
  constructor(private consumer: Consumer) {}

  bindHandlers<SuccessResponseType, FailureResponseType>(
    onSuccessFallback: Function,
    onFailureFallback: Function
  ) {
    return this.consumer
      .consume(async ({ message }) => {
        const key = message.key.toString();
        if (key === undefined) return;

        const [resolve, reject] = getPromiseHandlers(key) ?? [
          onSuccessFallback,
          onFailureFallback,
        ];

        const value = message.value?.toString();
        if (value === undefined) return reject(new NoValueException());

        let obj;
        try {
          obj = JSON.parse(value);
        } catch (ex) {
          return reject(new ValueParsingFailedException());
        }
        if ("failure" in obj) return reject(obj.failure as FailureResponseType);
        if ("ok" in obj) {
          return resolve({ key, value: obj.ok as SuccessResponseType });
        }
      })
      .catch((error) => {
        console.error(error);
        process.exit(-1);
      });
  }
}
