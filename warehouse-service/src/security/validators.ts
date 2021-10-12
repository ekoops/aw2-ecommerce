import {
  body,
  param, query,
  Result,
  ValidationChain,
  ValidationError,
  validationResult,
} from "express-validator";
import mongoose from "mongoose";
import { NextFunction, Request, Response } from "express";
import FieldsValidationErrorResponse, {FieldErrorReasons} from "../responses/FieldsValidationErrorResponse";
import Category from "../domain/Category";

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
    error.code = 17;
    return next(error);
  } else return next();
};

// const validateObjectId = (validationChain: ValidationChain): ValidationChain => {
//   return validationChain.custom((id) => {
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       throw new Error(`The provided id(${id}) is not valid`);
//     } else return true;
//   });
// };

const validateCategory = (validationChain: ValidationChain): ValidationChain => {
  return validationChain.custom((category: Category) => {
    if (!category) return true;
    if (Object.values(Category).includes(category)) return true;

    throw new Error(`The category "${category}" does not exist`);

  });
}

const validateStars = (validationChain: ValidationChain): ValidationChain => {
  return validationChain.custom((stars: number) => {
    return stars >= 0 && stars <= 5;
  });
}

const validators: Validators = {
  getProductByCategory: [validateCategory(query("category"))],
  postProduct: [
    body('name').exists().isString(),
    validateCategory(body('category')),
    body('price').exists().isNumeric(),
    body('comments.*.title').exists().isString(),
    body('comments.*.body').exists().isString(),
    body('comments.*.stars').exists().isNumeric(),
    validateStars(body('comments.*.stars')).withMessage('Stars must be greater than 0 and less than 5'),
  ]
};

export { checkErrors, validators };
