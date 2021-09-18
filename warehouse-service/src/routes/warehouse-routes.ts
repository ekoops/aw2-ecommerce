import express from "express";
import { WarehouseController, warehouseController } from "../controllers/warehouse-controller";
import { warehouseService } from "../services/warehouse-service";
import { validators, checkErrors } from "../validators";

const router = express.Router();


router.post(
    '/',
    // validators.postWarehouse,
    // checkErrors,
    warehouseController.insertWarehouse
)

router.get(
    '/',
    warehouseController.getWarehouses
)

router.get(
    '/:warehouseId',
    warehouseController.getWarehouseById
)

router.put(
    '/:warehouseId',
    warehouseController.putWarehouseById
)

router.patch(
    '/:warehouseId',
    warehouseController.patchWarehouseById
)

export default router;
