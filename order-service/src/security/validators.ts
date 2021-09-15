import {
  param,
  body,
  ValidationChain,
  validationResult,
  Result,
  ValidationError,
} from "express-validator";
import mongoose from "mongoose";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { OrderStatus, toOrderStatus } from "../db/OrderStatus";

interface Validators {
  [key: string]: ValidationChain[];
}

const formatError = (errors: Result<ValidationError>) => {
  return {
    code: 400,
    name: "INVALID_FIELDS",
    messages: errors
      .array()
      .map((err) => ({ field: err.param, message: err.msg })),
  };
};

const checkErrors = (req: Request, res: Response, next: NextFunction) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    const error = formatError(validationErrors);
    console.log(JSON.stringify(error.messages, null, " "));
    return next(error);
  } else return next();
};

const validateId = (validationChain: ValidationChain): ValidationChain => {
  return validationChain.custom((id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(`The provided id(${id}) is not valid`);
    } else return true;
  });
};

const validators: Validators = {
  getOrders: [],
  getOrder: [validateId(param("id"))],
  postOrder: [
    // validateId(body("buyerId")),
    body("deliveryAddress")
      .isString()
      .withMessage("A valid delivery address must be specified"),
    body("items")
      .isArray({ min: 1 })
      .withMessage("A valid items list must be specified"),
    validateId(body("items.*.productId")),
    body("items.*.amount")
      .isInt({ min: 1 })
      .withMessage("The items amount must be greater than 0"),
  ],
  patchOrder: [
    validateId(param("id")),
    body("status")
      .isString()
      .withMessage("The new status must be a valid one")
      .bail()
      .custom((status) => {
        // try to see if the string status contains a number...
        if (!isNaN(status) || toOrderStatus(status)) {
          throw new Error("The new status must be a valid one");
        }
      }),
  ],
  deleteOrder: [validateId(param("id"))],
};

export { checkErrors, validators };
