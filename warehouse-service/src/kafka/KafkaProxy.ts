import {
  Kafka,
  ProducerRecord,
  ConsumerSubscribeTopic,
  RecordMetadata,
  ITopicConfig,
  KafkaConfig,
  ConsumerRunConfig
} from "kafkajs";
import {
  CannotCreateAdminException,
  CannotCreateConsumerException,
  CannotCreateProducerException,
  CannotCreateTopicException,
  CannotRetrieveTopicListException,
} from "../exceptions/kafka/KafkaException"
import Logger from "../utils/Logger";
import {CannotProduceException} from "../exceptions/kafka/communication/ProducerException";

export interface Admin {
  createTopics(topics: ITopicConfig[]): Promise<void>;
  listTopics(): Promise<string[]>;
}

export interface Producer {
  produce(producerRecord: ProducerRecord): Promise<RecordMetadata[]>;
}

export interface Consumer {
  consume(
    callback: (key: string, value: string | undefined) => Promise<void>,
    filter?: (key: string) => boolean
  ): Promise<void>;
}

const NAMESPACE = "KAFKA";

export default class KafkaProxy {
  private static _instance: KafkaProxy;
  private kafka: Kafka;

  constructor(kafkaConfig: KafkaConfig) {
    this.kafka = new Kafka(kafkaConfig);
  }
  static getInstance(kafkaConfig: KafkaConfig) {
    return this._instance || (this._instance = new this(kafkaConfig));
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
            Logger.error(NAMESPACE, "cannot create topics: %v", ex);
            // throw new CannotCreateTopicException();
          }

          const topicNames = topics.map((t) => t.topic);
          if (!haveBeenCreated) {
            Logger.error(
              NAMESPACE,
              "failed to create the following topics %v",
              topicNames
            );
            // throw new CannotCreateTopicException();
          }
          Logger.dev(NAMESPACE, "topics created: %v", topicNames);
        },
        listTopics: async (): Promise<string[]> => {
          try {
            const topics = await admin.listTopics();
            Logger.dev(NAMESPACE, "retrieved topics: %v", topics);
            return topics;
          } catch (ex) {
            Logger.error(NAMESPACE, "failed to retrieve topics list: %v", ex);
            // @ts-ignore
            throw new CannotRetrieveTopicListException(ex.toString());
          }
        },
      };
    } catch (ex) {
      Logger.error(
        NAMESPACE,
        "failed to established a cluster admin connection: %v",
        ex
      );
      // @ts-ignore
      throw new CannotCreateAdminException(ex.toString());
    }
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
        produce: async (
          producerRecord: ProducerRecord
        ): Promise<RecordMetadata[]> => {
          try {
            const result = await producer.send(producerRecord);
            Logger.dev(NAMESPACE, "produced: %v", producerRecord);
            return result;
          } catch (ex) {
            Logger.error(NAMESPACE, "failed to produce %v", producerRecord);
            // The transaction id cannot be handled at this level
            throw new CannotProduceException("no_id");
          }
        },
      };
    } catch (ex) {
      Logger.error(
        NAMESPACE,
        "failed to established a cluster producer connection: %v",
        ex
      );
      // @ts-ignore
      throw new CannotCreateProducerException(ex.toString());
    }
  }

  async createConsumer(
    groupId: string,
    topics: ConsumerSubscribeTopic[],
    consumerRunConfig: ConsumerRunConfig = {}
  ): Promise<Consumer> {
    const consumer = this.kafka.consumer({ groupId });

    const subscriptionsPromises: Promise<void>[] = [];
    topics.forEach((topic) => {
      const subscriptionPromise: Promise<void> = consumer.subscribe(topic);
      subscriptionsPromises.push(subscriptionPromise);
    });

    try {
      Logger.dev(
        NAMESPACE,
        "creating consumer... trying to subscript to the topics %v",
        topics
      );
      await Promise.all(subscriptionsPromises);

      Logger.dev(
        NAMESPACE,
        "topics subscription done... trying to established a cluster consumer connection on group %v",
        groupId
      );
      await consumer.connect();

      Logger.dev(
        NAMESPACE,
        "cluster consumer connection established on group %v",
        groupId
      );
      return {
        consume: (
          callback: (key: string, value: string | undefined) => Promise<void>,
          filter?: (key: string) => boolean
        ) => {

          return consumer.run({
            ...consumerRunConfig,
            eachMessage: async (payload: any) => {
              const key = payload.message.key.toString();
              if (filter !== undefined && !filter(key)) return;
              const value = payload.message.value?.toString();
              Logger.dev(NAMESPACE, "consumed: {key: %v, value: %v", key, value);
              await callback(key, value);
            },
          });
        },
      };
    } catch (ex) {
      Logger.error(
        NAMESPACE,
        "failed to established a cluster consumer connection: %v",
        ex
      );
      // @ts-ignore
      throw new CannotCreateConsumerException(ex.toString());
    }
  }
}
