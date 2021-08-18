import config from "./config/config";
import initDbConnection from "./db/db-nosql";
import KafkaProxy from "./kafka/KafkaProxy";
import getApp from "./app";
import { OrderModel } from "./models/Order";
import OrderRepositoryNosql from "./repositories/order-repository-nosql";
import OrderService from "./services/order-service";
import OrderController from "./controllers/order-controller";
import initConsumers from "./kafka/consumers";
import ProducerProxy from "./kafka/ProducerProxy";
import OctRepository from "./repositories/oct-repository";
import { OctModel } from "./models/Oct";
import EurekaClient from "./discovery/eureka";
import {CannotCreateProducerException} from "./exceptions/kafka/kafka-exceptions";
import {DbConnectionFailedException} from "./exceptions/db/db-exceptions";

const run = async () => {
  const { host, port, clientId } = config.kafka;
  const broker = `${host}:${port}`;
  const kafkaProxy = KafkaProxy.getInstance(clientId, [broker]);

  const [_, producer] = await Promise.all([
    initDbConnection(),
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

  // initConsumers(kafkaProxy, orderService);

  const { rootPath } = config.server.api;

  const app = await getApp(rootPath, orderController);
  app.listen(config.server.port, () => {
    console.log(`Server is listening on port ${config.server.port}`);
    EurekaClient.start((err) => {
      if (err) {
        console.error(err);
        process.exit(3);
      }
     });
  });
};

run().catch((ex) => {
  if (ex instanceof CannotCreateProducerException) {
    console.error("Cannot create producer:", ex);
    process.exit(1);
  }
  if (ex instanceof DbConnectionFailedException) {
    console.error("Cannot connect to db instance");
    process.exit(2);
  }
  console.log("QUA", JSON.stringify(ex));
  process.exit(255);
});
