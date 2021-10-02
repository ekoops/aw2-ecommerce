import mongoose from "mongoose";
import { Source, SourceDTO, sourceSchema } from "./Source";

export interface OrderItem {
  productId: string;
  amount: number;
  perItemPrice: number;
  sources: Source[];
}

export interface OrderItemDTO {
  productId: string;
  amount: number;
  perItemPrice?: number;
  sources?: SourceDTO[];
}

export const orderItemSchema = new mongoose.Schema<OrderItem>(
  {
    productId: {
      type: mongoose.Schema.Types.String,
      required: [true, "The product id is required"],
    },
    amount: {
      type: mongoose.Schema.Types.Number,
      required: [true, "The amount is required"],
      min: [1, "The item amount must be greater or equal than 1"],
    },
    perItemPrice: {
      type: mongoose.Schema.Types.Number,
      required: [true, "The price per item is required"],
    },
    sources: {
      type: [sourceSchema],
      default: [],
    },
  },
  { _id: false }
);

export const OrderItemModel = mongoose.model<OrderItem>("OrderItem", orderItemSchema);