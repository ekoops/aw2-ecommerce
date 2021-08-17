import { Producer } from "./KafkaProxy";
import { RecordMetadata } from "kafkajs";
import { CannotProduceException } from "../exceptions/kafka/kafka-exceptions";
import { generateUUID } from "./utils";
import RequestStore from "./RequestStore";
import config from "../config/config";

const requestStore = RequestStore.getInstance();

export default class ProducerProxy {
  constructor(public producer: Producer) {}

  produceAndWaitForResponse<ResponseType>(
    topic: string,
    message: any,
    uuid: string = generateUUID()
  ) {
    return new Promise<{ key: string; value: ResponseType }>(
      (resolve, reject) => {
        requestStore.setRequestHandlers(uuid, resolve, reject);
        this.producer
          .produce({
            topic,
            messages: [
              {
                key: uuid,
                value: JSON.stringify(message),
              },
            ],
          })
          .then((recordMetadata: RecordMetadata[]) => {
            // TODO: logging
              if (config.environment === "development") {
                  console.log(JSON.stringify(recordMetadata));
              }
          })
          .catch((err) => {
            console.error(err);
            requestStore.removeRequestHandlers(uuid);
            const exception = new CannotProduceException();
            reject(exception);
          });
      }
    );
  }
}
