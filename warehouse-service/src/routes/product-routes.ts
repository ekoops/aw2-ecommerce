import express from "express";
import { ProductController, productController } from "../controllers/product-controller";
import { validators, checkErrors } from "../validators";

const router = express.Router();

router.get(
    '/',
    validators.getProductByCategory,
    checkErrors,
    productController.getProducts
)

router.get(
    '/:id',
    // validators.getProductById, che validazione usare?
    checkErrors,
    productController.getProductById
)

router.delete(
    '/:id',
    checkErrors,
    productController.deleteProductById
)

router.put(
    '/:id',
    validators.postProduct,
    checkErrors,
    productController.putProduct
)

router.patch(
    '/:id',
    checkErrors,
    productController.patchProduct
)

router.post(
    '/',
    validators.postProduct,
    checkErrors,
    productController.insertProduct
)

export default router;
