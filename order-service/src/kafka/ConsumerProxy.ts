import { Consumer } from "./KafkaProxy";
import RequestStore, { FailurePayload } from "./RequestStore";
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
      console.log('got resolve and reject: ', typeof resolve)
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

    return this.consumer.consume(async (key: string, value: string|undefined) => {
      console.log('!!!! received response on topic: ', key);
      console.log('The value is: ', value);
      const contains = requestStore.contains(key);
      console.log('contains is: ', contains);
      if (!contains) {
        console.log('Exiting')
        return;
      }
      consumerFn(key, value);
    }) //, filterFn);
  }
}
