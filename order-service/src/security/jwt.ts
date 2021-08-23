import {RequestHandler} from "express";
import jwt from "jsonwebtoken";
import Logger from "../utils/logger";
import {toUserRole, User} from "../dtos/DTOs";
import {UnauthorizedException} from "../exceptions/exceptions";

const NAMESPACE = "JWT";

export const handleJwt: RequestHandler = (req, res, next) => {
    const authHeader = req.header("Authorization");
    if (authHeader !== undefined) {
        // assuming that the api gateway verify the jwt
        const decodedJwt:any = jwt.decode(authHeader);
        Logger.dev(NAMESPACE, `jwt payload: ${decodedJwt}`);

        const userRole = toUserRole(decodedJwt.role);
        if (userRole === undefined) throw new UnauthorizedException();

        res.locals.user = {
            id: decodedJwt.id,
            role: userRole
        } as User;
    }
    next();
};