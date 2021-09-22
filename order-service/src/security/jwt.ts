import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import Logger from "../utils/Logger";
import { toUserRole, User } from "../dtos/DTOs";
import {UnauthorizedException} from "../exceptions/AuthException";

const NAMESPACE = "JWT";

export const handleJwt: RequestHandler = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (authHeader === undefined || !authHeader.startsWith("Bearer ")) {
    Logger.error(NAMESPACE, `invalid auth header: ${authHeader}`);
    throw new UnauthorizedException();
  }
  const token = authHeader.substr(authHeader.indexOf(" ") + 1);
  // assuming that the api gateway verify the jwt
  const decodedJwt: any = jwt.decode(token);
  Logger.dev(NAMESPACE, `jwt payload: ${JSON.stringify(decodedJwt)}`);

  const userRole = toUserRole(decodedJwt.role);
  if (userRole === undefined) throw new UnauthorizedException();

  res.locals.user = {
    id: decodedJwt.id,
    role: userRole,
    deliveryAddress: decodedJwt.deliveryAddress
  } as User;
  next();
};
