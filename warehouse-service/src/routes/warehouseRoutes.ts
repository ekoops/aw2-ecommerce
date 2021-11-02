import express from "express";
import WarehouseController from "../controllers/WarehouseController";
import { handleJwt } from "../security/jwt";
import { UserRole } from "../domain/User";
import { checkErrors, validators } from "../security/validators";

const router = express.Router();

const getRouter = (warehouseController: WarehouseController) => {
  const router = express.Router();

  router.use(handleJwt);

  router.use((req, res, next) => {
    const role = res.locals.user.role;
    const isAdmin = role === UserRole.ADMIN;
    if (!isAdmin) {
      next({
        code: 18,
        message: "Reserved to admin",
      });
      return;
    }
    next();
  });

  router.post(
    "/",
    warehouseController.insertWarehouse
  );

  router.get(
    // TODO: quando non ci sono warehouse non ritorna errore
    "/",
    warehouseController.getWarehouses
  );

  router.get(
    "/:warehouseId",
    validators.validateWarehouseId,
    checkErrors,
    warehouseController.getWarehouseById
  );

  router.put(
    "/:warehouseId",
    validators.validateWarehouseId,
    checkErrors,
    warehouseController.putWarehouseById
  );

  router.patch(
    "/:warehouseId",
    validators.validateWarehouseId,
    checkErrors,
    warehouseController.patchWarehouseById
  );

  router.delete(
    "/:warehouseId",
    validators.validateWarehouseId,
    checkErrors,
    warehouseController.deleteWarehouseById
  );

  return router;
};

export default getRouter;
