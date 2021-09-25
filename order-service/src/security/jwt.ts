import {RequestHandler} from "express";
import jwt from "jsonwebtoken";
import Logger from "../utils/Logger";
import User, {UserRole} from "../domain/User";
import UserUtility from "../utils/UserUtility";
import UnauthorizedResponse from "../responses/UnauthorizedResponse";

const NAMESPACE = "JWT";

export const handleJwt: RequestHandler = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (authHeader === undefined || !authHeader.startsWith("Bearer ")) {
    Logger.error(NAMESPACE, "invalid auth header: _", authHeader);
    return res.status(401).json(new UnauthorizedResponse());
  }
  const token = authHeader.substr(authHeader.indexOf(" ") + 1);
  // assuming that the api gateway verify the jwt...
  const decodedJwt: any = jwt.decode(token);
  Logger.dev(NAMESPACE, "jwt payload: _", decodedJwt);

  const userRole = UserUtility.toUserRole(decodedJwt.role);
  if (userRole === undefined) {
    return res.status(401).json(new UnauthorizedResponse());
  }

  const deliveryAddress = decodedJwt.deliveryAddress;
  if (deliveryAddress === undefined && userRole === UserRole.CUSTOMER) {
    return res.status(401).json(new UnauthorizedResponse());
  }

  res.locals.user = {
    id: decodedJwt.id,
    role: userRole,
    deliveryAddress: deliveryAddress
  } as User;
  next();
};
