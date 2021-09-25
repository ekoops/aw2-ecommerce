import mongoose from "mongoose";
import {
  OrderItem,
  OrderItemDTO,
  orderItemSchema,
} from "./OrderItem";
import {
  OrderStatus,
  OrderStatusType,
  toOrderStatusName,
} from "../db/OrderStatus";

export interface Order {
  _id?: string;
  buyerId: number;
  deliveryAddress: string;
  status?: OrderStatusType;
  items: OrderItem[];
  warehouseHasApproved?: boolean;
  walletHasApproved?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderDTO {
  id?: string;
  buyerId: number;
  deliveryAddress: string;
  status?: OrderStatusType;
  items: OrderItemDTO[];
  createdAt?: Date;
}

const orderSchema = new mongoose.Schema<Order>(
  {
    buyerId: {
      type: Number,
      required: [true, "The buyer id is required"],
    },
    deliveryAddress: {
      type: String,
      required: [true, "The delivery address is required"],
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "ISSUED",
        "DELIVERING",
        "DELIVERED",
        "FAILED",
        "CANCELED",
      ],
      default: toOrderStatusName(OrderStatus.PENDING),
      message: "{VALUE} is not supported",
    },
    items: {
      type: [orderItemSchema],
      default: [],
    },
    warehouseHasApproved: {
      type: Boolean,
      default: false,
    },
    walletHasApproved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const OrderModel = mongoose.model<Order>("Order", orderSchema, "orders");
