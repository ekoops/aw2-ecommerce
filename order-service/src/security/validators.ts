import {
  body,
  param,
  Result,
  ValidationChain,
  ValidationError,
  validationResult,
} from "express-validator";
import mongoose from "mongoose";
import { NextFunction, Request, Response } from "express";
import OrderStatusUtility from "../utils/OrderStatusUtility";
import FieldsValidationErrorResponse, {FieldErrorReasons} from "../responses/FieldsValidationErrorResponse";
import Logger from "../utils/Logger";

interface Validators {
  [key: string]: ValidationChain[];
}

const formatError = (errors: Result<ValidationError>) => {
  // for each field, create a FieldErrorReasons object containing all the reasons
  const invalidFields: FieldErrorReasons[] = errors
    .array()
    .map((err) => new FieldErrorReasons(err.param, err.msg));
  // wrap the FieldErrorReasons array into a suitable ErrorResponse instance
  return new FieldsValidationErrorResponse(invalidFields);
};

const checkErrors = (req: Request, res: Response, next: NextFunction) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    const error = formatError(validationErrors);
    return next(error);
  } else return next();
};

const validateObjectId = (validationChain: ValidationChain): ValidationChain => {
  return validationChain.custom((id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(`The provided id(${id}) is not valid`);
    } else return true;
  });
};

const validators: Validators = {
  getOrders: [],
  getOrder: [validateObjectId(param("id"))],
  postOrder: [
    // body("deliveryAddress")
    //   .isString()
    //   .withMessage("A valid delivery address must be specified"),
    body("items")
      .isArray({ min: 1 })
      .withMessage("A valid items list must be specified"),
    validateObjectId(body("items.*.productId")),
    body("items.*.amount")
      .isInt({ min: 1 })
      .withMessage("The items amount must be greater than 0"),
  ],
  patchOrder: [
    validateObjectId(param("id")),
    body("status")
      .isString()
      .withMessage("The new status must be a valid one")
      .bail()
      .custom((status) => {
        // try to see if the string status contains a number...
        if (!isNaN(status) || OrderStatusUtility.toOrderStatus(status) === undefined) {
          throw new Error("The new status must be a valid one");
        }
        return true
      }),
  ],
  deleteOrder: [validateObjectId(param("id"))],
};

export { checkErrors, validators };
