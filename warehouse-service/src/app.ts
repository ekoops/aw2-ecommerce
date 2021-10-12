import getProductRoutes from "./routes/productRoutes";
import getWarehouseRoutes from "./routes/warehouseRoutes";
import express, {ErrorRequestHandler, RequestHandler} from "express";
import morgan from "morgan";
import ProductController from "./controllers/ProductController";
import WarehouseController from "./controllers/WarehouseController";
import ProducerProxy from "./kafka/ProducerProxy";
import InternalServerErrorResponse from "./responses/InternalServerErrorResponse";
import RouteNotFoundResponse from "./responses/RouteNotFoundResponse";
import OrderController from "./controllers/OrderController";

const getApp = async (
    rootPath: string,
    productController: ProductController,
    warehouseController: WarehouseController,
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

    const warehousePath = `${rootPath}/warehouses`;
    const warehouseRoutes = getWarehouseRoutes(warehouseController);

    app.use(warehousePath, warehouseRoutes);

    const productPath = `${rootPath}/products`;
    const productRoutes = getProductRoutes(productController);

    app.use(productPath, productRoutes);

    const notFoundResponse = new RouteNotFoundResponse();
    const notFoundHandler: RequestHandler = (req, res, next) => {
        res.status(404).json(notFoundResponse);
    };

    const internalServerErrorResponse = new InternalServerErrorResponse();
    const exceptionHandler: ErrorRequestHandler = (err, req, res, next) => {
        if (err.code) {
            res.status(500).json(err);
        } else {
            res.status(500).json(internalServerErrorResponse);
        }
    };

    app.use(notFoundHandler, exceptionHandler);

    return app;
};

export default getApp;