import express from "express";
import WarehouseController from "../controllers/WarehouseController";
import {handleJwt} from "../security/jwt";

const router = express.Router();

const getRouter = (warehouseController: WarehouseController) => {
    const router = express.Router();

    router.use(handleJwt);

    router.post(
        '/',
        // validators.postWarehouse,
        // checkErrors,
        warehouseController.insertWarehouse
    );

    router.get(
        '/',
        warehouseController.getWarehouses
    );

    router.get(
        '/:warehouseId',
        warehouseController.getWarehouseById
    );

    router.put(
        '/:warehouseId',
        warehouseController.putWarehouseById
    );

    router.patch(
        '/:warehouseId',
        warehouseController.patchWarehouseById
    );

    return router;
};

export default getRouter;
