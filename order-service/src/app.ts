import getOrderRoutes from "./routes/orderRoutes";
import express, {ErrorRequestHandler, RequestHandler} from "express";
import morgan from "morgan";
import OrderController from "./controllers/OrderController";
import InternalServerErrorResponse from "./responses/InternalServerErrorResponse";
import RouteNotFoundResponse from "./responses/RouteNotFoundResponse";
import FieldsValidationErrorResponse from "./responses/FieldsValidationErrorResponse";

const getApp = async (
    rootPath: string,
    orderController: OrderController
) => {
    const app = express();

    app.use(morgan("dev"));
    app.use(express.json());

    const statusPath = `${rootPath}/status`;


    app.get(statusPath, (req, res) => {
        res.status(200).json({status: "on"});
    });

    const orderPath = `${rootPath}/orders`;
    const orderRoutes = getOrderRoutes(orderController);

    app.use(orderPath, orderRoutes);

    const notFoundResponse = new RouteNotFoundResponse();
    const notFoundHandler: RequestHandler = (req, res) => {
        res.status(404).json(notFoundResponse);
    };

    const internalServerErrorResponse = new InternalServerErrorResponse();
    const exceptionHandler: ErrorRequestHandler = (err, req, res) => {
        if (err instanceof FieldsValidationErrorResponse) {
            res.status(400).json(err);
            return;
        }
        res.status(500).json(internalServerErrorResponse);
    };

    app.use(notFoundHandler, exceptionHandler);

    return app;
};

export default getApp;
