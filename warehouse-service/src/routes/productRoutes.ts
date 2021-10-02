import express from "express";
import ProductController from "../controllers/ProductController";
import { validators, checkErrors } from "../security/validators";
import {handleJwt} from "../security/jwt";

const getRouter = (productController: ProductController) => {
    const router = express.Router();

    router.use(handleJwt);

    router.get(
        '/',
        validators.getProductByCategory,
        checkErrors,
        productController.getProducts
    );

    router.get(
        '/:id',
        // validators.getProductById, che validazione usare?
        checkErrors,
        productController.getProductById
    );

    router.delete(
        '/:id',
        checkErrors,
        productController.deleteProductById
    );

    router.put(
        '/:id',
        validators.postProduct,
        checkErrors,
        productController.putProduct
    );

    router.patch(
        '/:id',
        checkErrors,
        productController.patchProduct
    );

    router.post(
        '/',
        validators.postProduct,
        checkErrors,
        productController.insertProduct
    );

    router.post(
        '/:id/picture',
        express.text({type: '*/*'}),
        productController.postPicture
    );

    router.get(
        '/:id/picture',
        productController.getPicture
    );

    router.get(
        '/:productId/warehouses',
        productController.getWarehousesByProductId
    );

    return router;
}
export default getRouter;
