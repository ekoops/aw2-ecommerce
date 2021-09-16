import express from 'express'
import mongoose from "mongoose";
import AppError from '../models/AppError';
import { ProductDto } from '../models/Product';
import { productService, ProductService } from '../services/product-service';


export class ProductController {
    constructor(private productService: ProductService) {
        this.productService = productService
    }
    
    async getProducts(req: express.Request, res: express.Response, next: express.NextFunction) {
        const categoryParam = req.query.category as string;
        let filter: {[key: string]: string} = {};
        if (categoryParam) {
            filter.category = categoryParam;
        }

        const products: ProductDto[] = await productService.findProducts(filter);
        console.log('ctr: ', products)

        res.json(products);
    }

    async getProductById(req: express.Request, res: express.Response, next: express.NextFunction) {
        const productId = req.params["id"];
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            next(new AppError(404, 'Product not found'));
            return;
        }

        const products: ProductDto[] = await productService.findProducts({_id: productId});
        if (products.length === 0) {
            next(new AppError(404, 'Product not found'))
            return;
        } 

        const product = products[0];
        res.json(product);
    }

    async insertProduct(req: express.Request, res: express.Response, next: express.NextFunction) {
        const product: ProductDto = req.body;
        if (!product.comments) product.comments = [];
        product.comments.forEach(c => {
            if (!c.creationDate) c.creationDate = new Date();
        });
        product.creationDate = new Date();
        delete product.averageRating;
        const result = await productService.insertProducts([product]);
        res.json(result);
    }

    async deleteProductById(req: express.Request, res: express.Response, next: express.NextFunction) {
        const productId = req.params["id"];
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            next(new AppError(404, 'Product not found'));
            return;
        }

        const result = await productService.deleteProduct({_id: productId});

        res.json({
            deleted: result
        })
    }

    async putProduct(req: express.Request, res: express.Response, next: express.NextFunction) {
        const productId = req.params["id"];
        const product: ProductDto = req.body;
        let result;
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            next(new AppError(404, 'Product not found'));
            return;
        }

        result = await productService.deleteProduct({_id: productId});
        if (result.deletedCount === 1) {
            if (!product.comments) product.comments = [];
            product.comments.forEach(c => {
                if (!c.creationDate) c.creationDate = new Date()
            });
            product.creationDate = new Date();
            product._id = productId;
            delete product.averageRating;
            result = (await productService.insertProducts([product]))[0];
        }
        res.json(result); 
    }

    async patchProduct(req: express.Request, res: express.Response, next: express.NextFunction) {
        const productId = req.params["id"];
        let product: ProductDto = req.body;
        let result;
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            next(new AppError(404, 'Product not found'));
            return;
        }

        const oldProduct = (await productService.findProducts({_id: productId}))[0];
        if (!oldProduct) {
            next(new AppError(404, 'Product not found'));
            return;
        }
        result = await productService.deleteProduct({_id: productId});
        if (result.deletedCount === 1) {
            if (!product.comments) product.comments = [];
            product.comments.forEach(c => {
                if (!c.creationDate) c.creationDate = new Date()
            });
            product.creationDate = new Date();
            product._id = productId;
            product = {
                ...oldProduct,
                ...product,
            }
            delete product.averageRating;
            result = (await productService.insertProducts([product]))[0];
        }
        res.json(result);
    }
}

export const productController = new ProductController(productService)