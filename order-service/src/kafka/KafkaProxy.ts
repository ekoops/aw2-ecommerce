import {
  Kafka,
  ProducerRecord,
  ConsumerSubscribeTopic,
  EachMessagePayload,
  RecordMetadata,
  ITopicConfig,
} from "kafkajs";
import config from "../config/config";
import {
  CannotCreateAdminException,
  CannotCreateConsumerException,
  CannotCreateProducerException,
  CannotCreateTopicException,
  CannotRetrieveTopicListException,
} from "../exceptions/kafka/kafka-exceptions";
import Logger from "../utils/logger";

export interface Admin {
  createTopics(topics: ITopicConfig[]): Promise<void>;
  listTopics(): Promise<string[]>;
}

export interface Producer {
  produce(producerRecord: ProducerRecord): Promise<RecordMetadata[]>;
}

export interface Consumer {
  consume(
    callback: (payload: EachMessagePayload) => Promise<void>
  ): Promise<void>;
}

const NAMESPACE = "KAFKA";

export default class KafkaProxy {
  private static _instance: KafkaProxy;
  private kafka: Kafka;

  constructor(clientId: string, brokers: string[]) {
    this.kafka = new Kafka({
      clientId,
      brokers,
      retry: {
        initialRetryTime: 500,
      },
    });
  }
  static getInstance(clientId: string, brokers: string[]) {
    return this._instance || (this._instance = new this(clientId, brokers));
  }

  async createAdmin(): Promise<Admin> {
    try {
      const admin = this.kafka.admin();
      Logger.dev(NAMESPACE, "trying to established a cluster admin connection");
      await admin.connect();
      Logger.dev(NAMESPACE, "cluster admin connection established");

      return {
        createTopics: async (topics: ITopicConfig[]): Promise<void> => {
          let haveBeenCreated;
          try {
            haveBeenCreated = await admin.createTopics({ topics });
          } catch (ex) {
            Logger.error(NAMESPACE, `cannot create topics: ${ex.toString()}`);
            throw new CannotCreateTopicException();
          }

          const topicNames = topics.map((t) => t.topic);
          if (!haveBeenCreated) {
            Logger.error(
                NAMESPACE,
                `failed to create the following topics ${topicNames}`
            );
            throw new CannotCreateTopicException();
          }
          Logger.dev(NAMESPACE, `topics created: ${topicNames}`);
        },
        listTopics: async (): Promise<string[]> => {
          try {
            const topics = await admin.listTopics();
            Logger.dev(NAMESPACE, `retrieved topics: ${topics}`);
            return topics;
          } catch (ex) {
            Logger.error(
              NAMESPACE,
              `failed to retrieve topics list: ${ex.toString()}`
            );
            throw new CannotRetrieveTopicListException(ex.toString());
          }
        },
      };
    } catch (ex) {
      Logger.error(
        NAMESPACE,
        `failed to established a cluster admin connection: ${ex.toString()}`
      );
      throw new CannotCreateAdminException(ex.toString());
    }
    // await admin.disconnect();
  }

  async createProducer(): Promise<Producer> {
    try {
      const producer = this.kafka.producer();
      Logger.dev(
        NAMESPACE,
        "trying to established a cluster producer connection"
      );
      await producer.connect();
      Logger.dev(NAMESPACE, "cluster producer connection established");
      return {
        produce: async (producerRecord: ProducerRecord) => {
          const result = await producer.send(producerRecord);
          Logger.dev(
            NAMESPACE,
            `message produced: ${JSON.stringify(result, null, " ")}`
          );
          return result;
        },
      };
    } catch (ex) {
      Logger.error(
        NAMESPACE,
        `failed to established a cluster producer connection: ${ex.toString()}`
      );
      throw new CannotCreateProducerException(ex.toString());
    }
  }

  async createConsumer(
    groupId: string,
    topics: ConsumerSubscribeTopic[]
  ): Promise<Consumer> {
    const consumer = this.kafka.consumer({ groupId });

    const subscriptionsPromises: Promise<void>[] = [];
    topics.forEach((topic) => {
      const subscriptionPromise: Promise<void> = consumer.subscribe(topic);
      subscriptionsPromises.push(subscriptionPromise);
    });

    try {
      await Promise.all(subscriptionsPromises);

      if (config.environment === "development") {
        console.log("Kafka's consumer connected to cluster");
      }

      Logger.dev(
        NAMESPACE,
        `trying to established a cluster consumer connection on group ${groupId}`
      );
      await consumer.connect();
      Logger.dev(
        NAMESPACE,
        `cluster consumer connection established on group ${groupId}`
      );
      return {
        consume: (callback: (payload: EachMessagePayload) => Promise<void>) => {
          return consumer.run({
            eachMessage: callback,
          });
        },
      };
    } catch (ex) {
      Logger.error(
        NAMESPACE,
        `failed to established a cluster consumer connection: ${ex.toString()}`
      );
      throw new CannotCreateConsumerException(ex.toString());
    }
  }
}
