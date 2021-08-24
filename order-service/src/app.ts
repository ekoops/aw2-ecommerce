import getOrderRoutes from "./routes/order-routes";
import ErrorResponse from "./models/ErrorResponse";
import express, { ErrorRequestHandler, RequestHandler } from "express";
import morgan from "morgan";
import OrderController from "./controllers/order-controller";
import ProducerProxy from "./kafka/ProducerProxy";
import { OrderDTO } from "./dtos/DTOs";
import { RecordMetadata } from "kafkajs";
import { OrderStatus } from "./db/OrderStatus";
import Logger from "./utils/logger";

const getApp = async (
  rootPath: string,
  orderController: OrderController,
  producerProxy: ProducerProxy
) => {
  const app = express();

  app.use(morgan("dev"));
  app.use(express.json());

  const producePath = `${rootPath}/produce`;
  const statusPath = `${rootPath}/status`;

  app.post(producePath, async (req, res, next) => {
    const { topic, key, message } = req.body;
    producerProxy.producer
        .produce({
          topic,
          messages: [{ key: key, value: JSON.stringify(message) }],
        })
        .then((recordMetadata) => res.status(200).json(recordMetadata))
        .catch((err) => res.status(200).json(err));
  });

  app.get(statusPath, (req, res) => {
    res.status(200).json({ status: "on" });
  });

  const orderPath = `${rootPath}/orders`;
  const orderRoutes = getOrderRoutes(orderController);

  app.use(orderPath, orderRoutes);



  const notFoundHandler: RequestHandler = (req, res, next) => {
    const notFoundError = new ErrorResponse(404, "Route not found");
    next(notFoundError);
  };

  const internalServerError = new ErrorResponse(500, "InternalServerError");
  const exceptionHandler: ErrorRequestHandler = (err, req, res, next) => {
    if (!(err instanceof ErrorResponse)) {
      err = internalServerError;
    }
    res.status(err.code).json(err);
  };

  app.use(notFoundHandler, exceptionHandler);

  return app;
};

export default getApp;
