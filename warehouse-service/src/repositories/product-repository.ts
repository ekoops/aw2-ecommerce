import mongoose from 'mongoose';
import { Product, ProductModel } from '../models/Product';

export type InsertionResult = (Product & mongoose.Document<any, any, Product>)[];
export type DeletionResult = ({ok?: number | undefined; n?: number | undefined;} & { deletedCount?: number | undefined; })

export class ProductRepository {
    constructor(private ProductModel: mongoose.Model<Product>) { }

    async findProducts(filter: {[key: string]: string}): Promise<Product[]> {
        console.log(filter);
        const products = await this.ProductModel.find(filter);
        console.log('Found: ', products);
        return products;
    }

    async insertProducts(products: Product[]): Promise<InsertionResult> {
        const result = await this.ProductModel.insertMany(products);
        console.log('Inserted ', result);
        return result;
    }

    async deleteProduct(filter: {[key: string]: string}): Promise<DeletionResult> {
        const result = await this.ProductModel.deleteOne(filter);
        console.log('Deleted ', result);
        return result;
    }

    async updateProduct(filter: {[key: string]: string}, product: Product): Promise<DeletionResult> {
        const result = await this.ProductModel.updateOne(filter, product);
        console.log('Updated ', result);
        return result;
    }
}

export const productRepository = new ProductRepository(ProductModel);
