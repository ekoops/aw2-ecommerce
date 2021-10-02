import {ITopicConfig} from "kafkajs";
import {Admin} from "./KafkaProxy";

const initTopics = async (admin: Admin): Promise<void> =>  {
    const actualTopicList = await admin.listTopics();
    const desiredTopicList = [
        "order-items-availability-requested",
        "order-items-availability-produced",
        "budget-availability-requested",
        "budget-availability-produced",
        "order-approved",
        "order-creation-warehouse-response",
        "order-creation-wallet-response",
        "order-created",
        "order-cancelled",
    ];
    const topicsToCreateList: ITopicConfig[] = desiredTopicList
        .filter(topicName => !actualTopicList.includes(topicName))
        .map(topicName => ({topic: topicName, numPartitions: 3}));

    if (topicsToCreateList.length !== 0) {
        return admin.createTopics(topicsToCreateList);
    }
};

export default initTopics;