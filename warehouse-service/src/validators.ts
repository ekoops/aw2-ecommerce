import { param, body, ValidationChain, validationResult, Result, ValidationError, query } from "express-validator";
import mongoose from "mongoose";
import {NextFunction, Request, RequestHandler, Response} from "express";
import Category from "./models/Category";
import AppError from "./models/AppError";

interface Validators {
  [key: string]: ValidationChain[];
}

const formatError = (errors: Result<ValidationError>) => {
  return {
    code: 400,
    name: "INVALID_FIELDS",
    messages: errors
        .array()
        .map((err: any) => ({ field: err.param, message: err.msg })),
  };
};

const validateId = (validationChain: ValidationChain): ValidationChain => {
  return validationChain.custom((id: any) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(`The provided id(${id}) is not valid`);
    } else return true;
  });
};

const checkErrors = (req: Request, res: Response, next: NextFunction) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    const error = formatError(validationErrors);
    console.log(JSON.stringify(error.messages, null, " "));
    const appError = new AppError(error.code, error.messages[0].message);
    return next(appError);
  } else return next();
};


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

const validators = {
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

export {
  validators,
  checkErrors
};