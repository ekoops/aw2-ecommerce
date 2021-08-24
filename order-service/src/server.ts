import config from "./config/config";
import initDbConnection from "./db/db";
import KafkaProxy from "./kafka/KafkaProxy";
import { KafkaConfig } from "kafkajs";
import getApp from "./app";
import { OrderModel } from "./models/Order";
import OrderRepository from "./repositories/order-repository";
import OrderService from "./services/order-service";
import OrderController from "./controllers/order-controller";
import initConsumers from "./kafka/init-consumers";
import ProducerProxy from "./kafka/ProducerProxy";
import OctRepository from "./repositories/oct-repository";
import { OctModel } from "./models/Oct";
import {
  CannotCreateAdminException,
  CannotCreateProducerException,
  CannotCreateTopicException,
  CannotRetrieveTopicListException,
} from "./exceptions/kafka/kafka-exceptions";
import { DbConnectionFailedException } from "./exceptions/db/db-exceptions";
import initTopics from "./kafka/init-topics";
import { retry } from "./utils/utils";
import Logger from "./utils/logger";

const NAMESPACE = config.server.instance.id;

const run = async () => {
  const { host, port, clientId, initialRetryTime } = config.kafka;
  const brokers = [`${host}:${port}`];
  const kafkaConfig: KafkaConfig = {
    clientId,
    brokers,
    retry: { initialRetryTime },
  };
  const kafkaProxy = KafkaProxy.getInstance(kafkaConfig);

  const [_, admin, producer] = await Promise.all([
    retry(3, initDbConnection),
    kafkaProxy.createAdmin(),
    kafkaProxy.createProducer(),
  ]);

  const producerProxy = new ProducerProxy(producer);

  const orderRepository = OrderRepository.getInstance(OrderModel);
  const octRepository = OctRepository.getInstance(OctModel);
  const orderService = OrderService.getInstance(
    orderRepository,
    octRepository,
    producerProxy
  );
  const orderController = OrderController.getInstance(orderService);

  await initTopics(admin);
  initConsumers(kafkaProxy, orderService);

  const { rootPath } = config.server.api;
  const webServerPort = config.server.port;

  const app = await getApp(rootPath, orderController, producerProxy);
  app.listen(webServerPort, async () => {
    Logger.log(NAMESPACE, `Server is listening on port ${webServerPort}`);
    // try {
    //   await initEurekaClient();
    //   Logger.dev(NAMESPACE, "connected successfully");
    // }
    // catch (ex) {
    //   Logger.error(NAMESPACE, "cannot establish a connection to the discovery service");
    //   process.exit(6);
    // }
  });
};

run().catch((ex) => {
  if (ex instanceof DbConnectionFailedException) {
    Logger.error(NAMESPACE, "cannot establish a connection to the db");
    process.exit(1);
  }
  if (ex instanceof CannotCreateAdminException) {
    Logger.error(
      NAMESPACE,
      "cannot establish an admin connection to kafka cluster"
    );
    process.exit(2);
  }
  if (ex instanceof CannotCreateProducerException) {
    Logger.error(
      NAMESPACE,
      "cannot establish a producer connection to kafka cluster"
    );
    process.exit(3);
  }
  if (ex instanceof CannotRetrieveTopicListException) {
    Logger.error(NAMESPACE, "cannot retrieve kafka topics list");
    process.exit(4);
  }
  if (ex instanceof CannotCreateTopicException) {
    Logger.error(NAMESPACE, "cannot create the needed kafka topics");
    process.exit(5);
  }
  // TODO complete exception handling
  Logger.error(NAMESPACE, `generic error: ${JSON.stringify(ex)}`);
  process.exit(255);
});
