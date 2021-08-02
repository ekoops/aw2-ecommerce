import express from 'express'
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

    async insertProduct(req: express.Request, res: express.Response, next: express.NextFunction) {
        const product: ProductDto = req.body;
        if (!product.comments) product.comments = [];
        product.comments.forEach(c => {
            if (!c.creationDate) c.creationDate = new Date()
        });
        product.creationDate = new Date();
        delete product.averageRating;
        const result = await productService.insertProducts([product]);
        res.json(result);
    }
}

export const productController = new ProductController(productService)