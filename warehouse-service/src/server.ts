import config from "./config/config";
import ProductService from "./services/ProductService";
import initDbConnection from "./db/initDbConnection";
import { KafkaConfig } from "kafkajs";
import KafkaProxy from "./kafka/KafkaProxy";
import ProducerProxy from "./kafka/ProducerProxy";
import initTopics from "./kafka/initTopics";
import initConsumers from "./kafka/initConsumers";
import Logger from "./utils/Logger";
import { retry } from "./utils/utils";
import getApp from "./app";
import ProductController from "./controllers/ProductController";
import WarehouseController from "./controllers/WarehouseController";
import EurekaClient from "./discovery/eureka";
import { WarehouseModel } from "./domain/Warehouse";
import { PictureModel, ProductModel } from "./domain/Product";
import { DbConnectionFailedException } from "./exceptions/db/DbException";
import {
  CannotCreateAdminException,
  CannotCreateConsumerException,
  CannotCreateProducerException,
  CannotCreateTopicException,
  CannotRetrieveTopicListException,
} from "./exceptions/kafka/KafkaException";
import ProductRepository from "./repositories/ProductRepository";
import OrderRepository from "./repositories/OrderRepository";
import { OrderModel } from "./domain/Order";
import OrderService from "./services/OrderService";
import OrderController from "./controllers/OrderController";
import WarehouseRepository from "./repositories/WarehouseRepository";
import WarehouseService from "./services/WarehouseService";

const NAMESPACE = "SERVER";

const run = async () => {
  const { host, port, clientId, initialRetryTime } = config.kafka;
  const brokers = [`${host}:${port}`];
  const kafkaConfig: KafkaConfig = {
    clientId,
    brokers,
    retry: { initialRetryTime, retries: 25 },
  };
  const kafkaProxy = KafkaProxy.getInstance(kafkaConfig);

  const [_, admin, producer] = await Promise.all([
    retry(3, 3000, initDbConnection),
    kafkaProxy.createAdmin(),
    kafkaProxy.createProducer(),
  ]);

  const producerProxy = new ProducerProxy(producer);

  const warehouseRepository = WarehouseRepository.getInstance(
    WarehouseModel,
    ProductModel
  );
  const productRepository = ProductRepository.getInstance(
    ProductModel,
    PictureModel
  );

  const productService = ProductService.getInstance(productRepository);
  const warehouseService = WarehouseService.getInstance(warehouseRepository);

  const warehouseController = WarehouseController.getInstance(
    warehouseService,
    productService
  );
  const productController = ProductController.getInstance(
    productService,
    warehouseService
  );

  const orderRepository = OrderRepository.getInstance(OrderModel);
  const orderService = OrderService.getInstance(
    orderRepository,
    warehouseService,
    productService,
    producerProxy
  );
  const orderController = OrderController.getInstance(orderService);

  await initTopics(admin);
  await initConsumers(kafkaProxy, orderController);

  const { rootPath } = config.server.api;
  const webServerPort = config.server.port;

  const app = await getApp(
    rootPath,
    productController,
    warehouseController,
    orderController,
    producerProxy
  );
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

  Logger.error(NAMESPACE, "generic error: _", ex);
  process.exit(255);
});
