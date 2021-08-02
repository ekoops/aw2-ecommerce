import express from "express";
import { productController } from "../controllers/product-controller";
import { validators, checkErrors } from "../validators";

const router = express.Router();

router.get(
    '/',
    validators.getProductByCategory,
    checkErrors,
    productController.getProducts
)

router.post(
    '/',
    validators.postProduct,
    checkErrors,
    productController.insertProduct
)

export default router;
