import mongoose from "mongoose";
import {
  OrderItem,
  OrderItemDTO,
  orderItemSchema,
} from "./OrderItem";
import {
  OrderStatus,
  OrderStatusName,
} from "./OrderStatus";
import OrderStatusUtility from "../utils/OrderStatusUtility";

export interface Order {
  _id?: string;
  buyerId: number;
  deliveryAddress: string;
  status: OrderStatusName;
  items: OrderItem[];
  warehouseHasApproved: boolean;
  walletHasApproved: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderDTO {
  id?: string;
  buyerId: number;
  deliveryAddress: string;
  status?: OrderStatusName;
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
      default: OrderStatusUtility.toOrderStatusName(OrderStatus.PENDING),
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
