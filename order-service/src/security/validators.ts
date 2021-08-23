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
import { OrderStatus } from "../db/OrderStatus";

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
    validateId(body("buyerId")),
    body("products")
      .isArray({ min: 1 })
      .withMessage("A valid products list must be specified"),
    validateId(body("products.*.id")),
    body("products.*.amount")
      .isInt({ min: 1 })
      .withMessage("The products amount must be greater than 0"),
  ],
  patchOrder: [
    validateId(param("id")),
    body("status").custom((status) =>
        // TODO optimize check
      Object.keys(OrderStatus)
        .filter((s) => isNaN(+s))
        .includes(status)
    ),
  ],
  deleteOrder: [validateId(param("id"))],
};

export { checkErrors, validators };
