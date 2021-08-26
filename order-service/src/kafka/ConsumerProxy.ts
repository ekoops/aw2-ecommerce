import { Consumer } from "./KafkaProxy";
import RequestStore, {FailureHandler, FailurePayload} from "./RequestStore";
import { KafkaException } from "../exceptions/kafka/kafka-exceptions";
import { NoHandlersException } from "../exceptions/application-exceptions";
import {
  NoValueException,
  ValueFormatNotValidException,
  ValueParsingFailedException,
} from "../exceptions/communication-exceptions";

export type ExceptionBuilder = (...args: any) => FailurePayload;

const requestStore = RequestStore.getInstance();

export default class ConsumerProxy {
  constructor(private consumer: Consumer) {}

  bindHandlers<SuccessResponseType>(
    // onSuccessFallback: (payload: SuccessPayload) => any,
    failureHandler: FailureHandler,
    exceptionBuilder: ExceptionBuilder
  ) {
    return this.consumer.consume(
      async (key: string, value: string | undefined) => {
        if (key === "") return; // TODO right control?

        const handlers = requestStore.get(key);
        if (handlers === undefined)
          return failureHandler(new NoHandlersException(key));
        const [resolve, reject] = handlers;

        if (value === undefined) return reject(new NoValueException(key));

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
        } else return reject(new ValueFormatNotValidException(key)); // TODO must be handled
      }
    );
  }
}
