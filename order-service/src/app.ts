
import orderRoutes from "./routes/order-routes";

import express, {ErrorRequestHandler, RequestHandler} from "express";

const app = express();

app.use((req, res) => {
    res.json({"demo": "demo"});
});

app.use("/orders", orderRoutes);

const notFoundHandler: RequestHandler = (req, res, next) => {
    const notFoundError = new AppError(404, "Route not found")
    next(notFoundError);
}

const internalServerError = new AppError(500, "InternalServerError");
const exceptionHandler: ErrorRequestHandler = (err, req, res, next) => {
    if (!(err instanceof AppError)) {
        err = internalServerError;
    }
    res.status(err.code).json(err);

}

app.use(notFoundHandler, exceptionHandler);


export default app;