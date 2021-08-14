import config from "./config/config";
import initDbConnection from "./db/db-nosql";
import KafkaProxy from "./kafka/KafkaProxy";
import getApp from "./app";
import { OrderModel } from "./models/Order";
import OrderRepositoryNosql from "./repositories/order-repository-nosql";
import OrderService from "./services/order-service";
import { OrderController } from "./controllers/order-controller";
import initConsumers from "./kafka/consumers";
import RequestStore from "./kafka/RequestStore";
import ProducerProxy from "./kafka/ProducerProxy";

const run = async () => {
  const clientId = "clientId"; // TODO
  const { host, port } = config.kafka;
  const broker = `${host}:${port}`;
  const kafkaProxy = KafkaProxy.getInstance(clientId, [broker]);

  const [_, producer] = await Promise.all([
    initDbConnection(),
    kafkaProxy.getProducerInstance(),
  ]);

  const requestStore = new RequestStore();
  const producerProxy = new ProducerProxy(producer, requestStore);

  const orderRepository = OrderRepositoryNosql.getInstance(OrderModel);
  const orderService = OrderService.getInstance(orderRepository, producerProxy);
  const orderController = OrderController.getInstance(orderService);

  await initConsumers(kafkaProxy, orderService);

  const { rootPath } = config.server.api;

  const app = await getApp(rootPath, orderController);
  app.listen(config.server.port, () =>
    console.log(`Server is listening on port ${config.server.port}`)
  );
};

run().catch((err) => {
  console.errror(err);
  process.exit(-1);
});
