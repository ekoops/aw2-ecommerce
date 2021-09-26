import config from "./config/config";
import initDbConnection from "./db/initDbConnection";
import KafkaProxy from "./kafka/KafkaProxy";
import { KafkaConfig } from "kafkajs";
import getApp from "./app";
import { OrderModel } from "./domain/Order";
import OrderRepository from "./repositories/OrderRepository";
import OrderController from "./controllers/OrderController";
import initConsumers from "./kafka/initConsumers";
import ProducerProxy from "./kafka/ProducerProxy";
import {
  CannotCreateAdminException,
  CannotCreateConsumerException,
  CannotCreateProducerException,
  CannotCreateTopicException,
  CannotRetrieveTopicListException,
} from "./exceptions/kafka/KafkaException";
import { DbConnectionFailedException } from "./exceptions/db/DbException";
import initTopics from "./kafka/initTopics";
import { retry } from "./utils/utils";
import Logger from "./utils/Logger";
import OrderService from "./services/OrderService";
import EurekaClient from "./discovery/eureka";

const NAMESPACE = "SERVER";

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
    retry(3, 3000, initDbConnection),
    kafkaProxy.createAdmin(),
    kafkaProxy.createProducer(),
  ]);

  const producerProxy = new ProducerProxy(producer);

  const orderRepository = OrderRepository.getInstance(OrderModel);
  const orderService = OrderService.getInstance(orderRepository, producerProxy);
  const orderController = OrderController.getInstance(orderService);

  await initTopics(admin);
  initConsumers(kafkaProxy);

  const { rootPath } = config.server.api;
  const webServerPort = config.server.port;

  const app = await getApp(rootPath, orderController, producerProxy);
  app.listen(webServerPort, async () => {
    Logger.log(NAMESPACE, `Server is listening on port ${webServerPort}`);
    EurekaClient.start((err: Error) => {
      if (err) {
        Logger.error(
          NAMESPACE,
          "cannot establish a connection to the discovery service: _}",
          err
        );
        process.exit(7);
      }
      Logger.dev(NAMESPACE, "connected successfully to the discovery service");
    });
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
  if (ex instanceof CannotCreateConsumerException) {
    Logger.error(
      NAMESPACE,
      "cannot establish a producer connection to kafka cluster"
    );
    process.exit(6);
  }

  // TODO complete exception handling
  Logger.error(NAMESPACE, "generic error: _", ex);
  process.exit(255);
});
