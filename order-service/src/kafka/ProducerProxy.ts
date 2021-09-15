import { Producer } from "./KafkaProxy";
import RequestStore from "./RequestStore";

const requestStore = RequestStore.getInstance();

export default class ProducerProxy {
  constructor(public producer: Producer) {}

  produceAndWaitResponse<ResponseType>(
    topic: string,
    key: string,
    message: any
  ) {
    return new Promise<{ key: string; value: ResponseType }>(
      async (resolve, reject) => {
        try {
          await this.producer.produce({
            topic,
            messages: [{ key, value: JSON.stringify(message) }],
          });

          requestStore.set(key, resolve, reject);
        } catch (ex) {
          requestStore.remove(key);
          // The exception can be only of type CannotProduceException,
          // so it is necessary to add the transactionId
          ex.transactionId = key;
          reject(ex);
        }
      }
    );
  }
}
