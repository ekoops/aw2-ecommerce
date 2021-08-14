import {Kafka, ProducerRecord, ConsumerSubscribeTopic, EachMessagePayload, RecordMetadata} from "kafkajs";
import config from "../config/config";
import {callbackify} from "util";

export interface Producer {
    produce: (producerRecord: ProducerRecord) => Promise<RecordMetadata[]>;
}

export interface Consumer {
    consume: (callback:  (payload: EachMessagePayload) => Promise<void>) => Promise<void>
}

let kafka : Kafka | null = null;

export const getKafkaInstance = (clientId: string, brokers: string[]) => {
    if (kafka === null) {
        kafka =new Kafka({
            // clientId: "order-svc", //TODO: adding unique clientId
            brokers,
        });
    }
    return kafka;
};

export const createProducer = async (kafka: Kafka): Promise<Producer> => {
    const producer = kafka.producer();
    await producer.connect();
    console.log("Kafka's producer connected to cluster")
    return {
        produce: async (producerRecord: ProducerRecord) => {
            const result = await producer.send(producerRecord);
            if (config.environment === "development") {
                console.log("produced:", JSON.stringify(result, null, " "));
            }
            return result;
        }
    };
};

export const createConsumer = async (kafka: Kafka, groupId: string, topics: ConsumerSubscribeTopic[]): Promise<Consumer> => {
    if (kafka === null) {
        throw Error("kafka module hasn't been initialized yet");
    }
    const consumer = kafka.consumer({
        groupId
    });

    const subscriptionsPromises: Promise<void>[] = [];
    topics.forEach(topic => {
        const subscriptionPromise: Promise<void> = consumer.subscribe(topic)
        subscriptionsPromises.push(subscriptionPromise);
    });

    await Promise.all(subscriptionsPromises);

    if (config.environment === "development") {
        console.log("Kafka's consumer connected to cluster");
    }

    await consumer.connect();
    consumer.run({eachMessage: async () => {}}).then()
    return {
        consume: (callback:  (payload: EachMessagePayload) => Promise<void>) => {
            return consumer.run({
                eachMessage: callback
            })
        }
    };
};