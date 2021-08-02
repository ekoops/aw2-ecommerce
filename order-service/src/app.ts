import orderRoutes from "./routes/order-routes";
import ErrorResponse from "./models/ErrorResponse";
import express, {ErrorRequestHandler, RequestHandler} from "express";
import morgan from "morgan";

const app = express();

app.use(morgan("dev"));
app.use(express.json());

app.use("/orders", orderRoutes);

const notFoundHandler: RequestHandler = (req, res, next) => {
    const notFoundError = new ErrorResponse(404, "Route not found");
    next(notFoundError);
}

const internalServerError = new ErrorResponse(500, "InternalServerError");
const exceptionHandler: ErrorRequestHandler = (err, req, res, next) => {
    if (!(err instanceof ErrorResponse)) {
        err = internalServerError;
    }
    res.status(err.code).json(err);
}

app.use(notFoundHandler, exceptionHandler);


export default app;