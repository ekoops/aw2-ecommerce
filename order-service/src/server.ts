import config from "./config/config";
import initDbConnection from "./db/db";
import KafkaProxy from "./kafka/KafkaProxy";
import getApp from "./app";
import { OrderModel } from "./models/Order";
import OrderRepositoryNosql from "./repositories/order-repository-nosql";
import OrderService from "./services/order-service";
import OrderController from "./controllers/order-controller";
import initConsumers from "./kafka/init-consumers";
import ProducerProxy from "./kafka/ProducerProxy";
import OctRepository from "./repositories/oct-repository";
import { OctModel } from "./models/Oct";
import EurekaClient from "./discovery/eureka";
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
  const { host, port, clientId } = config.kafka;
  const broker = `${host}:${port}`;
  const kafkaProxy = KafkaProxy.getInstance(clientId, [broker]);

  const [_, admin, producer] = await Promise.all([
    retry(3, initDbConnection),
    kafkaProxy.createAdmin(),
    kafkaProxy.createProducer(),
  ]);

  const producerProxy = new ProducerProxy(producer);

  const orderRepository = OrderRepositoryNosql.getInstance(OrderModel);
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

  const app = await getApp(rootPath, orderController);
  app.listen(webServerPort, () => {
    Logger.log(NAMESPACE, `Server is listening on port ${webServerPort}`);
    EurekaClient.start((err) => {
      const NAMESPACE = "EUREKA";
      if (err) {
        Logger.error(NAMESPACE, "cannot establish a connection to the discovery service");
        process.exit(6);
      }
      else {
        Logger.dev(NAMESPACE, "connected successfully");
      }
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
  // TODO complete exception handling
  Logger.error(NAMESPACE, `generic error: ${JSON.stringify(ex)}`);
  process.exit(255);
});
