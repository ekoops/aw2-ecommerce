import mongoose1 from "../db/db-nosql";
import { Product, productSchema } from "./Product";

export interface Order {
  _id: string;
  buyerId: number;
  createdAt: Date;
  status: OrderStatusType;
  products: Product[];
}

export interface OrderDTO {
  id: string;
  buyerId: number;
  createdAt: Date;
  status: OrderStatusType;
  products: Product[];
}

export const toOrderDTO = (order: Order): OrderDTO => {
  return {
    id: order._id,
    buyerId: order.buyerId,
    createdAt: order.createdAt,
    status:order.status,
    products: order.products
  }
}



const orderSchema = new mongoose1.Schema<Order>({
  buyerId: {
    type: Number,
    required: [true, "The buyer id is required"],
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
  status: {
    type: String,
    enum: ["ISSUED", "DELIVERING", "DELIVERED", "FAILED", "CANCELED"],
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

export const OrderModel = mongoose1.model<Order>("Order", orderSchema);