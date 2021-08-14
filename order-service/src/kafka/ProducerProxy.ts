import { Producer } from "./KafkaProxy";
import { RecordMetadata } from "kafkajs";
import { CannotProduceException } from "../exceptions/kafka/kafka-exceptions";
import { generateUUID } from "./utils";
import RequestStore from "./RequestStore";

export default class ProducerProxy {
  constructor(private producer: Producer, public requestStore: RequestStore) {}

  produceAndWaitForResponse<ResponseType>(
    topic: string,
    message: any,
    uuid: string = generateUUID(this.requestStore)
  ) {
    return new Promise<{ key: string; value: ResponseType }>(
      (resolve, reject) => {
        this.requestStore.setRequestHandlers(uuid, resolve, reject);
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
          })
          .catch((err) => {
            console.error(err);
            this.requestStore.removePromiseHandlers(uuid);
            const exception = new CannotProduceException();
            reject(exception);
          });
      }
    );
  }
}
