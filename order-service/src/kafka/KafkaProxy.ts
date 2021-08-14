import {
  Kafka,
  ProducerRecord,
  ConsumerSubscribeTopic,
  EachMessagePayload,
  RecordMetadata,
} from "kafkajs";
import config from "../config/config";
import { callbackify } from "util";

export interface Producer {
  produce: (producerRecord: ProducerRecord) => Promise<RecordMetadata[]>;
}

export interface Consumer {
  consume: (
    callback: (payload: EachMessagePayload) => Promise<void>
  ) => Promise<void>;
}

export default class KafkaProxy {
  private static _instance: KafkaProxy;
  private producer?: Producer;
  private kafka: Kafka;

  constructor(clientId: string, brokers: string[]) {
    this.kafka = new Kafka({
      // clientId: "order-svc", //TODO: adding unique clientId
      brokers,
    });
  }
  static getInstance(clientId: string, brokers: string[]) {
    return this._instance || (this._instance = new this(clientId, brokers));
  }
  async getProducerInstance() {
    if (this.producer) return this.producer;
    const producer = this.kafka.producer();
    await producer.connect();
    console.log("Kafka's producer connected to cluster");
    return (this.producer = {
      produce: async (producerRecord: ProducerRecord) => {
        const result = await producer.send(producerRecord);
        if (config.environment === "development") {
          console.log("produced:", JSON.stringify(result, null, " "));
        }
        return result;
      },
    });
  }

  async createConsumer(
    groupId: string,
    topics: ConsumerSubscribeTopic[]
  ): Promise<Consumer> {
    const consumer = this.kafka.consumer({
      groupId,
    });

    const subscriptionsPromises: Promise<void>[] = [];
    topics.forEach((topic) => {
      const subscriptionPromise: Promise<void> = consumer.subscribe(topic);
      subscriptionsPromises.push(subscriptionPromise);
    });

    await Promise.all(subscriptionsPromises);

    if (config.environment === "development") {
      console.log("Kafka's consumer connected to cluster");
    }

    await consumer.connect();
    consumer.run({ eachMessage: async () => {} }).then();
    return {
      consume: (callback: (payload: EachMessagePayload) => Promise<void>) => {
        return consumer.run({
          eachMessage: callback,
        });
      },
    };
  }
}
