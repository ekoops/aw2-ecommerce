import express from 'express'
import mongoose from "mongoose";
import AppError from '../models/AppError';
import { WarehouseRequestDto } from '../models/Warehouse';
import { productService } from '../services/product-service';
import { warehouseService, WarehouseService } from '../services/warehouse-service'


export class WarehouseController {
    constructor(private warehouseService: WarehouseService) {
        this.warehouseService = warehouseService
    }

    async insertWarehouse(req: express.Request, res: express.Response, next: express.NextFunction) {
        const warehouseRequest = req.body as WarehouseRequestDto;
        const invalid = warehouseRequest.products?.filter(item => {
            return !mongoose.Types.ObjectId.isValid(item.product._id);
        });
        console.log('invalid checked')

        if (invalid?.length) { // TODO: muovere il controllo nel service e fare ritornare un errore
            next(new AppError(500, `The product ids [${invalid.map(p=>p.product._id).join(', ')}] are not valid`));
            return;
        }

        const idsList = warehouseRequest.products?.map(item => item.product._id);
        const productsQuery = {
            "_id": {
                "$in": idsList
            }
        };

        const allProducts = await productService.findProducts(productsQuery);
        if (allProducts.length !== idsList?.length) {
            next(new AppError(500, `The product ids [${idsList?.join(', ')}] are not valid`)); // TODO: stampare solo id invalidi
            return;
        }
        const result = await warehouseService.insertWarehouses([warehouseRequest]);
        console.log('insertWarehouse, ', result);
        res.json(result);
    }


    async putWarehouseById(req: express.Request, res: express.Response, next: express.NextFunction) {
        const warehouseId = req.params['warehouseId'];
        const warehouse = req.body as WarehouseRequestDto;
        const newWarehouse = {...warehouse, _id: warehouseId};
        const result = await warehouseService.insertWarehouses([newWarehouse]);
        res.json(result);
    }

    async patchWarehouseById(req: express.Request, res: express.Response, next: express.NextFunction) {
        const warehouseId = req.params['warehouseId'];
        const warehouseFromBody = req.body as WarehouseRequestDto;
        const oldWarehouse = (await warehouseService.findWarehouses({_id: warehouseId}))[0]
        if (!oldWarehouse) {
            next(new AppError(404, 'Warehouse not found'));
            return;
        }

        const newWarehouse = {
            ...oldWarehouse,
            ...warehouseFromBody
        }

        const result = await warehouseService.insertWarehouses([newWarehouse]);
        res.json(result);
    }

    async getWarehouseById(req: express.Request, res: express.Response, next: express.NextFunction) {
        const warehouseId = req.params['warehouseId'];
        const warehouse = (await warehouseService.findWarehouses({_id: warehouseId}))[0]
        if (!warehouse) {
            next(new AppError(404, 'Warehouse not found'));
            return;
        }
        res.json(warehouse);
    }

    async deleteWarehouse(req: express.Request, res: express.Response, next: express.NextFunction) {
        const warehouseId = req.params['warehouseId']; // TODO: check if id exists
        const result = await warehouseService.deleteWarehouse(warehouseId);
        res.json(result);
    }

    async getWarehouses(req: express.Request, res: express.Response, next: express.NextFunction) {
        const warehouses = await warehouseService.findWarehouses({});
        const warehousesWithProducts = await WarehouseController.fillWarehouseProducts(warehouses);
        res.json(warehousesWithProducts);
    }

    public static async fillWarehouseProducts(warehousesList: WarehouseRequestDto[]) {
        const warehousesProductPromises = warehousesList.map(async w => {
            const idsList = w.products?.map(p => p.product._id);
            const productsQuery = {
                "_id": {
                    "$in": idsList
                }
            };
    
            return productService.findProducts(productsQuery);
        });

        const allProducts = await Promise.all(warehousesProductPromises);
        const warehousesWithProducts = warehousesList.map((w, index) => {
            allProducts[index].forEach((p, index_j) => {
                if (w.products) {
                    console.log(w.products[index_j], p);
                    // @ts-ignore
                    w.products[index_j] = p;
                }
            });
            return w;
        });

        return warehousesWithProducts;
    }
}

export const warehouseController = new WarehouseController(warehouseService);
