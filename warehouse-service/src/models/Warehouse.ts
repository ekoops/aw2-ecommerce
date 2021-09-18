import { Product } from "./Product";
import mongoose from 'mongoose';


export type WarehouseProduct = {
    product: Product,
    quantity: number,
}[];
export type WarehouseProductDto = {
    product: {
        _id: string;
    },
    quantity: number
}[];


export class Warehouse {
    public name: string | null;
    public products: WarehouseProduct | null;

    constructor(name: string, products: WarehouseProduct) {
        this.name = name;
        this.products = products;
    }
}

export class WarehouseRequestDto {
    public name: string | null;
    public products: WarehouseProductDto | null;

    constructor(name: string, products: WarehouseProductDto) {
        this.name = name;
        this.products = products;
    }
}

const schemaOptions = {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
}


const warehouseSchemaObj = {
    name: { type: mongoose.Schema.Types.String },
    products : [{
        quantity: { type: mongoose.Schema.Types.Number },
        product: {
            _id: { type: mongoose.Schema.Types.ObjectId }
        }
    }]
}

const warehouseSchema = new mongoose.Schema<WarehouseRequestDto>(warehouseSchemaObj, schemaOptions);
export const WarehouseModel = mongoose.model<WarehouseRequestDto>("Warehouse", warehouseSchema);
