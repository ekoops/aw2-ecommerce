import express from "express";
import mongoose from "mongoose";
import { PLACEHOLDER_IMG } from "../db/imgs";
import { ProductDto } from "../domain/Product";
import ProductService from "../services/ProductService";
import WarehouseService from "../services/WarehouseService";

export default class ProductController {
  private static _instance: ProductController;

  constructor(
    private productService: ProductService,
    private warehouseService: WarehouseService
  ) {}

  static getInstance(
    productService: ProductService,
    warehouseService: WarehouseService
  ) {
    return (
      this._instance ||
      (this._instance = new this(productService, warehouseService))
    );
  }

  getProducts = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const categoryParam = req.query.category as string;
    let filter: { [key: string]: string } = {};
    if (categoryParam) {
      filter.category = categoryParam;
    }

    const products: ProductDto[] = await this.productService.findProducts(
      filter
    );
    console.log("ctr: ", products);

    res.json(products);
  };

  getProductById = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const productId = req.params["id"];
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      next({
        code: 27,
        error: 'The following id is not a valid id ' + productId
      });
      return;
    }

    const products: ProductDto[] = await this.productService.findProducts({
      _id: productId,
    });
    if (products.length === 0) {
      next({
        code: 24,
        error: 'Cannot find the product with id ' + productId
      });
      return;
    }

    const product = products[0];
    res.json(product);
  };

  insertProduct = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    // TODO: deve essere admin
    const product: ProductDto = req.body;
    if (!product.comments) product.comments = [];
    product.comments.forEach((c) => {
      if (!c.createdAt) c.createdAt = new Date();
    });

    //@ts-ignore
    product.createdAt = new Date();
    delete product.averageRating;
    //TODO try catch?
    const result = await this.productService.insertProducts([product]);
    await this.productService.postPicture({
      _id: result[0]._id,
      url: PLACEHOLDER_IMG
    });
    res.json(result);
  };

  postPicture = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const pic = req.body;
    const productId = req.params["id"];

    const result = await this.productService.postPicture({
      _id: productId,
      url: pic,
    });
    console.log(result);
    res.write(pic);
    res.end();
  };

  getPicture = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const productId = req.params["id"];
    try {
      const result = (
        await this.productService.getPicture({ _id: productId })
      )[0];
  
      if (!result) {
        next({
          code: 21,
          error: 'Cannot find the product with id ' + productId
        });
        return;
      }
  
      console.log(result);
      res.write(result.url);
      res.end();
    } catch (ex) {
      console.log(ex);
      next({
        code: 30,
        error: 'Cannot find the product with id ' + productId
      });
      return;
    }

  };

  getWarehousesByProductId = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const productId = req.params["productId"];
    const result = await this.warehouseService.findWarehouses({
      "products.product._id": mongoose.Types.ObjectId(productId),
    });
    const resultWithProducts = await this.productService.fillWarehouseProducts(
      result
    );
    res.json(resultWithProducts);
  };

  deleteProductById = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const productId = req.params["id"];
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      next({
        code: 23,
        error: 'Cannot find the product with id ', productId
      });
      return;
    }

    const result = await this.productService.deleteProduct({ _id: productId });

    res.json({
      deleted: result,
    });
  };

  putProduct = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const productId = req.params["id"];
    const product: ProductDto = req.body;
    let result;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      next({
        code: 24,
        error: 'The following id is not a valid id ' + productId
      });
      return;
    }

    result = await this.productService.deleteProduct({ _id: productId });
    if (result.deletedCount === 1) {
      if (!product.comments) product.comments = [];
      product.comments.forEach((c) => {
        if (!c.createdAt) c.createdAt = new Date();
      });
      //@ts-ignore
      product.createdAt = new Date();
      product._id = productId;
      delete product.averageRating;
      result = (await this.productService.insertProducts([product]))[0];
    }
    res.json(result);
  };

  patchProduct = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const productId = req.params["id"];
    let product: ProductDto = req.body;
    let result;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      next({
        code: 25,
        error: 'The following id is not a valid id: ' + productId
      });
      return;
    }

    const oldProduct = (
      await this.productService.findProducts({ _id: productId })
    )[0];
    if (!oldProduct) {
      next({
        code: 24,
        error: 'Cannot find the product with id ' + productId
      });
      return;
    }
    result = await this.productService.deleteProduct({ _id: productId });
    if (result.deletedCount === 1) {
      if (!product.comments) product.comments = [];
      product.comments.forEach((c) => {
        if (!c.createdAt) c.createdAt = new Date();
      });
      //@ts-ignore
      product.createdAt = new Date();
      product._id = productId;
      product = {
        ...oldProduct,
        ...product,
      } as ProductDto;
      delete product.averageRating;
      result = (await this.productService.insertProducts([product]))[0];
    }
    res.json(result);
  };
}
