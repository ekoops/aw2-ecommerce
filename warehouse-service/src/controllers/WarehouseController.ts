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
    console.log("invalid checked");

    if (invalid?.length) {
      // TODO: muovere il controllo nel service e fare ritornare un errore
      next(
        new AppError(
          500,
          `The product ids [${invalid
            .map((p) => p.product._id)
            .join(", ")}] are not valid`
        )
      );
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
        new AppError(
          500,
          `The product ids [${idsList?.join(", ")}] are not valid`
        )
      ); // TODO: stampare solo id invalidi
      return;
    }
    const result = await this.warehouseService.insertWarehouses([
      warehouseRequest,
    ]);
    console.log("insertWarehouse, ", result);
    res.json(result);
  };

  putWarehouseById = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const warehouseId = req.params["warehouseId"];
    const warehouse = req.body as WarehouseRequestDto;
    const newWarehouse = { ...warehouse, _id: warehouseId };
    const result = await this.warehouseService.insertWarehouses([newWarehouse]);
    res.json(result);
  };

  patchWarehouseById = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const warehouseId = req.params["warehouseId"];
    const warehouseFromBody = req.body as WarehouseRequestDto;
    const oldWarehouse = (
      await this.warehouseService.findWarehouses({ _id: warehouseId })
    )[0];
    if (!oldWarehouse) {
      next(new AppError(404, "Warehouse not found"));
      return;
    }

    const newWarehouse = {
      ...oldWarehouse,
      ...warehouseFromBody,
    };

    const result = await this.warehouseService.insertWarehouses([newWarehouse]);
    res.json(result);
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
      next(new AppError(404, "Warehouse not found"));
      return;
    }
    res.json(warehouse);
  };

  deleteWarehouse = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const warehouseId = req.params["warehouseId"]; // TODO: check if id exists
    const result = await this.warehouseService.deleteWarehouse(warehouseId);
    res.json(result);
  };

  getWarehouses = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const warehouses = await this.warehouseService.findWarehouses({});
    const warehousesWithProducts =
      await this.productService.fillWarehouseProducts(warehouses);
    res.json(warehousesWithProducts);
  };
}
