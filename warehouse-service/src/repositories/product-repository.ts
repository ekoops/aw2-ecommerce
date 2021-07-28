import mongoose from 'mongoose';
import { Product, ProductModel } from '../models/Product';

export type InsertionResult = (Product & mongoose.Document<any, any, Product>)[];

export class ProductRepository {
    constructor(private ProductModel: mongoose.Model<Product>) { }

    async findProducts(filter: {[key: string]: string}): Promise<Product[]> {
        const products = await this.ProductModel.find(filter)
        console.log('Found: ', products);
        return products;
    }

    async insertProducts(products: Product[]): Promise<InsertionResult> {
        const result = await this.ProductModel.insertMany(products);
        console.log('Inserted ', result);
        return result;
    }
}

export const productRepository = new ProductRepository(ProductModel);
