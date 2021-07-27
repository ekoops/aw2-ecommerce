import mongoose from "mongoose"
import {Product, ProductDTO, productSchema, toProductDTO} from "./Product";
import {OrderStatus, OrderStatusType, toStatusName} from "../db/OrderStatus";

export interface Order {
  _id?: string;
  buyerId: string;
  createdAt?: Date;
  status?: OrderStatusType;
  products: Product[];
}

export interface OrderDTO {
  id?: string;
  buyerId: string;
  createdAt?: Date;
  status?: OrderStatusType;
  products: ProductDTO[];
}

export const toOrderDTO = (order: Order): OrderDTO => {
  return {
    id: order._id,
    buyerId: order.buyerId,
    createdAt: order.createdAt,
    status:order.status,
    products: order.products.map(toProductDTO)
  }
}

const orderSchema = new mongoose.Schema<Order>({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "The buyer id is required"],
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
  status: {
    type: String,
    enum: ["ISSUED", "DELIVERING", "DELIVERED", "FAILED", "CANCELED"],
    default: toStatusName(OrderStatus.ISSUED),
    message: "{VALUE} is not supported",
  },
  products: {
    type: [productSchema],
    default: [],
  }
}, {
    toJSON: { virtuals: true },
});

orderSchema.virtual("purchasePrice").get(function (this: Order) {
  return this.products.reduce(
    (acc, product) => acc + product.purchasePrice * product.amount,
    0
  );
});

export const OrderModel = mongoose.model<Order>("Order", orderSchema);