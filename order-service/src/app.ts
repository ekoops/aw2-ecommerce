import getOrderRoutes from "./routes/orderRoutes";
import express, {ErrorRequestHandler, RequestHandler} from "express";
import morgan from "morgan";
import OrderController from "./controllers/OrderController";
import ProducerProxy from "./kafka/ProducerProxy";
import InternalServerErrorResponse from "./responses/InternalServerErrorResponse";
import RouteNotFoundResponse from "./responses/RouteNotFoundResponse";
import {ApplicationException} from "./exceptions/kafka/communication/application/ApplicationException";

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
        const {topic, key, message} = req.body;
        producerProxy.producer
            .produce({
                topic,
                messages: [{key: key, value: JSON.stringify(message)}],
            })
            .then((recordMetadata) => res.status(200).json(recordMetadata))
            .catch((err) => res.status(200).json(err));
    });

    app.get(statusPath, (req, res) => {
        res.status(200).json({status: "on"});
    });

    const orderPath = `${rootPath}/orders`;
    const orderRoutes = getOrderRoutes(orderController);

    app.use(orderPath, orderRoutes);

    const notFoundResponse = new RouteNotFoundResponse();
    const notFoundHandler: RequestHandler = (req, res, next) => {
        res.status(404).json(notFoundResponse);
    };

    const internalServerErrorResponse = new InternalServerErrorResponse();
    const exceptionHandler: ErrorRequestHandler = (err, req, res, next) => {
        console.log(err)
        if (err instanceof ApplicationException) {
            res.status(406).json(err);
        }
        res.status(500).json(internalServerErrorResponse);
    };

    app.use(notFoundHandler, exceptionHandler);

    return app;
};

export default getApp;
