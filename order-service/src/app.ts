import getOrderRoutes from "./routes/order-routes";
import ErrorResponse from "./models/ErrorResponse";
import express, { ErrorRequestHandler, RequestHandler } from "express";
import morgan from "morgan";
import {OrderController} from "./controllers/order-controller";

const getApp = async (rootPath: string, orderController: OrderController) => {
  const app = express();

  app.use(morgan("dev"));
  app.use(express.json());

  const orderPath = `${rootPath}/orders`
  const orderRoutes = await getOrderRoutes(orderController);

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
