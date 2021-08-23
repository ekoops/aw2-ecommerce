import {RequestHandler} from "express";
import jwt from "jsonwebtoken";
import Logger from "../utils/logger";

const NAMESPACE = "JWT";

export const handleJwt: RequestHandler = (req, res, next) => {
    const authHeader = req.header("Authorization");
    if (authHeader !== undefined) {
        // assuming that the api gateway verify the jwt
        const decodedJwt = jwt.decode(authHeader);
        Logger.dev(NAMESPACE, `jwt payload: ${decodedJwt}`)
        res.locals.user = decodedJwt;
    }
    next();
};