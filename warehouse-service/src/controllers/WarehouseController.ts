import express from "express";
import mongoose from "mongoose";
import { WarehouseRequestDto } from "../domain/Warehouse";
import ProductService from "../services/ProductService";
import WarehouseService from "../services/WarehouseService";

export default class WarehouseController {
  private static _instance: WarehouseController;

  constructor(
    private warehouseService: WarehouseService,
    private productService: ProductService
  ) {}

  static getInstance(
    warehouseService: WarehouseService,
    productService: ProductService
  ) {
    return (
      this._instance ||
      (this._instance = new this(warehouseService, productService))
    );
  }

  insertWarehouse = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const warehouseRequest = req.body as WarehouseRequestDto;
    const invalid = warehouseRequest.products?.filter((item) => {
      return !mongoose.Types.ObjectId.isValid(item.product._id);
    });

    if (warehouseRequest.products?.some(p => p.quantity <= 0)) {
      next({
        error: 'Each product must have a quantity of 1 or greater',
        code : 20
      });
      return;
    }

    if (invalid?.length) {
      const invalidList = invalid.map((p) => p.product._id).join(", ");
      next({
        code: 1,
        message: `The product ids [${invalidList}] are not valid`
      });
      return;
    }

    const idsList = warehouseRequest.products?.map((item) => item.product._id);
    const productsQuery = {
      _id: {
        $in: idsList,
      },
    };

    const allProducts = await this.productService.findProducts(productsQuery);
    if (allProducts.length !== idsList?.length) {
      next(
        {
          code: 2,
          message: `The product ids [${idsList?.join(", ")}] are not valid`
        }
      );
      return;
    }
    const result = await this.warehouseService.insertWarehouses([
      warehouseRequest,
    ]);
    console.log("insertWarehouse, ", result);
    result.forEach(r => r.id = undefined)
    res.json(result);
  };

  putWarehouseById = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const warehouseId = req.params["warehouseId"];
    const warehouseFromBody = req.body as WarehouseRequestDto;
    const oldWarehouse = (
      await this.warehouseService.findWarehouses({ _id: warehouseId })
    )[0];

    if (warehouseFromBody.products?.some(p => p.quantity <= 0)) {
      next({
        error: 'Each product must have a quantity of 1 or greater',
        code : 20
      });
      return;
    }

    if (!oldWarehouse) {
      next({
        error: 'Cannot find warehouse with id: ', warehouseId,
        code: 19
      });
      return;
    }

    const newWarehouse = {
      ...warehouseFromBody,
      _id: warehouseId
    };

    try {
      await this.warehouseService.deleteWarehouse(warehouseId);
      const result = await this.warehouseService.insertWarehouses([newWarehouse]);
      result.forEach(r => r.id = undefined)
      res.json(result);  
    } catch (ex) {
      console.log(ex);
      next({
        code: 21,
        error: 'Cannot put warehouse'
      });
    }
  };


  deleteWarehouseById = async(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const warehouseId = req.params["warehouseId"];
    const result = await this.warehouseService.deleteWarehouse(warehouseId);
    console.log({deletionResult: result});
    res.status(204).end();
  }

  patchWarehouseById = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const warehouseId = req.params["warehouseId"];
    const warehouseFromBody = req.body as Partial<WarehouseRequestDto>;
    const oldWarehouse = (
      await this.warehouseService.findWarehouses({ _id: warehouseId })
    )[0];

    if (warehouseFromBody.products?.some(p => p.quantity <= 0)) {
      next({
        error: 'Each product must have a quantity of 1 or greater',
        code : 20
      });
      return;
    }

    if (!oldWarehouse) {
      next({
        error: 'Cannot find warehouse with id: ', warehouseId,
        code: 19
      });
      return;
    }

    console.log({oldWarehouse, warehouseFromBody})

    const newWarehouse = {
      products: oldWarehouse.products,
      name: oldWarehouse.name,
      ...warehouseFromBody,
      _id: warehouseId
    };

    console.log({newWarehouse})

    try {
      await this.warehouseService.deleteWarehouse(warehouseId);
      const result = await this.warehouseService.insertWarehouses([newWarehouse]);
      //@ts-ignore
      result.id = undefined; 
      res.json(result);  
    } catch (ex) {
      console.log(ex);
      next({
        code: 21,
        error: 'Cannot patch warehouse'
      });
    }
  };

  getWarehouseById = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const warehouseId = req.params["warehouseId"];
    const warehouse = (
      await this.warehouseService.findWarehouses({ _id: warehouseId })
    )[0];
    if (!warehouse) {
      next({
        error: 'Cannot find the warehouse with id ' + warehouseId,
        code: 33
      });
      return;
    }
    const warehouseWithProduct = (await this.productService.fillWarehouseProducts([warehouse]))[0];
    res.json(warehouseWithProduct);
  };

  deleteWarehouse = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const warehouseId = req.params["warehouseId"];
    try {
      const result = await this.warehouseService.deleteWarehouse(warehouseId);
      res.json(result);
    } catch (ex) {
      console.log(ex);
      res.json({
        code: 34,
        error: 'Cannot delete the warehouse with id ' + warehouseId
      });
      return;
    }

  };

  getWarehouses = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const warehouses = await this.warehouseService.findWarehouses({});
    console.log('warehouses: ', warehouses);
    const warehousesWithProducts = await this.productService.fillWarehouseProducts(warehouses);
    warehousesWithProducts.forEach(w => {
      //@ts-ignore
      w.id = undefined;
    });
    res.json(warehousesWithProducts);
  };
}
