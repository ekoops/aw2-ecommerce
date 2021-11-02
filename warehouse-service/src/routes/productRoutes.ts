import express from "express";
import ProductController from "../controllers/ProductController";
import { validators, checkErrors } from "../security/validators";
import { handleJwt } from "../security/jwt";
import { UserRole } from "../domain/User";

const getRouter = (productController: ProductController) => {
  const router = express.Router();

  router.get(
    "/",
    validators.getProductByCategory,
    checkErrors,
    productController.getProducts
  );

  router.get(
    "/:id",
    validators.validateProductId,
    checkErrors,
    productController.getProductById
  );

  router.get(
    "/:id/picture",
    validators.validateProductId,
    checkErrors,
    productController.getPicture
  );

  router.use(handleJwt);

  router.use((req, res, next) => {
    const role = res.locals.user.role;
    const isAdmin = role === UserRole.ADMIN;
    if (!isAdmin && req.method !== "PATCH") {
      next({
        code: 18,
        message: "Reserved to admin",
      });
      return;
    }
    next();
  });

  router.delete(
    "/:id",
    validators.validateProductId,
    checkErrors,
    productController.deleteProductById
  );

  router.put(
    "/:id",
    validators.validateProductId,
    validators.postProduct,
    checkErrors,
    productController.putProduct
  );

  router.patch(
    "/:id",
    validators.validateProductId,
    checkErrors,
    productController.patchProduct
  );

  router.post(
    "/",
    validators.postProduct,
    checkErrors,
    productController.insertProduct
  );

  router.post(
    "/:id/picture",
    validators.validateProductId,
    checkErrors,
    express.text({ type: "*/*" }),
    productController.postPicture
  );

  router.get(
    "/:id/warehouses",
    validators.validateProductId,
    checkErrors,
    productController.getWarehousesByProductId
  );

  return router;
};
export default getRouter;
