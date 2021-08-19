import {ITopicConfig} from "kafkajs";
import {Admin} from "./KafkaProxy";

const initTopics = async (admin: Admin) =>  {
    const actualTopicList = await admin.listTopics();
    const desiredTopicList = [
        "order-creation-requested",
        "order-items-availability-produced",
        "budget-availability-requested",
        "budget-availability-produced",
        "order-approved",
        "order-approved-by-warehouse",
        "order-approved-by-wallet",
        "order-created",
        "order-cancelled",
    ];
    const topicsToCreateList: ITopicConfig[] = desiredTopicList
        .filter(topicName => !actualTopicList.includes(topicName))
        .map(topicName => ({topic: topicName, numPartitions: 1}));
    const topicHasBeenCreated = await admin.createTopics(topicsToCreateList);

    if (!topicHasBeenCreated) {
        console.error("Failed to create the following topics:", topicsToCreateList);
        process.exit(4);
    }
    return;
};

export default initTopics;