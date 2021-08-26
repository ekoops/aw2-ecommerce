import { Producer } from "./KafkaProxy";
import { generateUUID } from "../utils/utils";
import RequestStore from "./RequestStore";
import { CannotProduceException } from "../exceptions/kafka/kafka-exceptions";

const requestStore = RequestStore.getInstance();

export default class ProducerProxy {
  constructor(public producer: Producer) {}

  produceAndWaitForResponse<ResponseType>(
    topic: string,
    message: any,
    uuid: string = generateUUID()
  ) {
    return new Promise<{ key: string; value: ResponseType }>(
      async (resolve, reject) => {
        requestStore.set(uuid, resolve, reject);
        try {
          await this.producer.produce({
            topic,
            messages: [{ key: uuid, value: JSON.stringify(message) }],
          });
        } catch (ex) {
          requestStore.remove(uuid);
          if (ex instanceof CannotProduceException) ex.transactionId = uuid;
          reject(ex);
        }
      }
    );
  }
}
