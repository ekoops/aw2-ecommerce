import mongoose from "mongoose"
import {OrderItem, orderItemSchema} from "./OrderItem";
import {OrderStatus, OrderStatusType, toOrderStatusName} from "../db/OrderStatus";

export interface Order {
  _id?: string;
  buyerId: string;
  createdAt?: Date;
  status?: OrderStatusType;
  items: OrderItem[];
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
    default: toOrderStatusName(OrderStatus.ISSUED),
    message: "{VALUE} is not supported",
  },
  items: {
    type: [orderItemSchema],
    default: [],
  }
}, {
    toJSON: { virtuals: true },
});

orderSchema.virtual("purchasePrice").get(function (this: Order) {
  return this.items.reduce(
    (acc, item) => acc + item.perItemPrice * item.amount,
    0
  );
});

export const OrderModel = mongoose.model<Order>("Order", orderSchema);