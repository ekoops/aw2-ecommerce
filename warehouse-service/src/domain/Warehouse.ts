import { Product } from "./Product";
import mongoose from "mongoose";

export type WarehouseProductDto = {
    product: {
        _id: string;
    },
    quantity: number
}[];
export type WarehouseProduct = {
    product: Product,
    quantity: number,
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
  toObject: { virtuals: true },
};

const warehouseSchemaObj = {
  name: { // TODO: ripristinare required
    type: mongoose.Schema.Types.String,
    // required: [true, "the warehouse name is required"],
  },
  products: [
    {
      quantity: {
        type: mongoose.Schema.Types.Number,
        // required: [true, "the product quantity is required"],
      },
      product: {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          // required: [true, "the product quantity is required"],
        },
        // required: [true, "the product is required"],
      },
    },
  ],
};


const warehouseSchema = new mongoose.Schema<Warehouse>(
  warehouseSchemaObj,
  schemaOptions
);
export const WarehouseModel = mongoose.model<Warehouse>(
  "Warehouse",
  warehouseSchema,
  "warehouses"
);
