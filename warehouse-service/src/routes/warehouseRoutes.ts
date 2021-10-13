import express from "express";
import WarehouseController from "../controllers/WarehouseController";
import {handleJwt} from "../security/jwt";
import {UserRole} from "../domain/User";

const router = express.Router();

const getRouter = (warehouseController: WarehouseController) => {
    const router = express.Router();

    router.use(handleJwt);

    router.use((req, res, next) => {
        const role = res.locals.user.role;
        const isAdmin = role === UserRole.ADMIN;
        if (!isAdmin && req.method !== 'GET') {
            next({
                code: 18,
                message: 'Reserved to admin'
            });
            return;
        }
        next();
    });
    
    router.post( 
        '/',
        // validators.postWarehouse,
        // checkErrors,
        warehouseController.insertWarehouse
    );

    router.get( // TODO: quando non ci sono warehouse non ritorna errore
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

    router.delete(
        '/:warehouseId',
        warehouseController.deleteWarehouseById
    );

    return router;
};

export default getRouter;
