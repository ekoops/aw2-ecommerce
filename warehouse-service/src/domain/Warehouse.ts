import { Product } from "./Product";
import mongoose from "mongoose";

export type WarehouseProductDto = {
  product: {
    _id: string;
  };
  quantity: number;
}[];
export type WarehouseProduct = {
  product: Product;
  quantity: number;
}[];

export class Warehouse {
  public _id: string | null;
  public name: string | null;
  public products: WarehouseProduct | null;

  constructor(_id: string, name: string, products: WarehouseProduct) {
    this._id = _id;
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
  versionKey: false,
  id: false,
};

interface WarehouseProductSpec {
  _id?: string;
}

const warehouseProductSpecSchema = new mongoose.Schema<WarehouseProductSpec>({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "the product id is required"],
  },
});

const warehouseProductSchema = new mongoose.Schema<WarehouseProduct>(
  {
    quantity: {
      type: mongoose.Schema.Types.Number,
      required: [true, "the product quantity is required"],
    },
    product: {
      type: warehouseProductSpecSchema,
      required: [true, "the product is required"],
    },
  },
  { _id: false }
);

const warehouseSchema = new mongoose.Schema<Warehouse>(
  {
    name: {
      type: mongoose.Schema.Types.String,
      required: [true, "the warehouse name is required"],
    },
    products: {
      type: [warehouseProductSchema],
      default: [],
    },
  },
  schemaOptions
);
export const WarehouseModel = mongoose.model<Warehouse>(
  "Warehouse",
  warehouseSchema,
  "warehouses"
);
