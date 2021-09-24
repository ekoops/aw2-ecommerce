import getOrderRoutes from "./routes/orderRoutes";
import express, { ErrorRequestHandler, RequestHandler } from "express";
import morgan from "morgan";
import OrderController from "./controllers/OrderController";
import ProducerProxy from "./kafka/ProducerProxy";
import { ErrorResponse } from "./responses/ErrorResponse";
import ErrorType from "./responses/ErrorType";

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

  const notFoundError = new ErrorResponse(
      ErrorType.ROUTE_NOT_FOUND,
      "route not found",
  );
  const notFoundHandler: RequestHandler = (req, res, next) => {
    res.status(404).json(notFoundError);
  };

  const internalServerError = new ErrorResponse(
    ErrorType.INTERNAL_ERROR,
    "an internal server error occurred",
    "this is a generic internal server error response"
  );
  const exceptionHandler: ErrorRequestHandler = (err, req, res, next) => {
    if (!(err instanceof ErrorResponse)) {
      res.status(500).json(internalServerError);
    }

    res.status(400).json(err);
  };

  app.use(notFoundHandler, exceptionHandler);

  return app;
};

export default getApp;
