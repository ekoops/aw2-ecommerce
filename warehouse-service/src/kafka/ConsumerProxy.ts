import { Consumer } from "./KafkaProxy";
import RequestStore, {FailurePayload, SuccessHandler, SuccessPayload} from "./RequestStore";
import {NoValueException, ValueParsingFailedException} from "../exceptions/kafka/communication/ConsumerException";

export type ExceptionBuilder = (...args: any) => FailurePayload;

const requestStore = RequestStore.getInstance();

export default class ConsumerProxy {
  constructor(private consumer: Consumer) {}

  bindHandlers<SuccessResponseType>(exceptionBuilder: ExceptionBuilder) {
    const filterFn = requestStore.contains;
    const consumerFn = async (key: string, value: string | undefined) => {
      // if filterFn pass, then requestStore contains resolve and reject function,
      // so it is safe to extract them
      const [resolve, reject] = requestStore.get(key)!;

      if (value === undefined || value === "")
        return reject(new NoValueException(key));

      let obj;
      try {
        obj = JSON.parse(value);
      } catch (ex) {
        return reject(new ValueParsingFailedException(key));
      }
      if ("failure" in obj) {
        return reject(exceptionBuilder(key, obj.failure));
      } else if ("ok" in obj) {
        return resolve({ key, value: obj.ok as SuccessResponseType });
      }
      return reject(new ValueParsingFailedException(key));
    };

    return this.consumer.consume(consumerFn, filterFn);
  }

  bindHandler<SuccessResponseType>(
    handler: SuccessHandler
  ) {
    const filterFn = requestStore.contains;
    const consumerFn = async (key: string, value: string | undefined) => {
      if (value === undefined || value === "") return;
      let obj;
      try {
        obj = JSON.parse(value);
      } catch (ex) {
        return;
      }
      if ("ok" in obj) {
        return handler({ key, value: obj.ok as SuccessResponseType });
      }
    };

    return this.consumer.consume(consumerFn, filterFn);
  }
}
