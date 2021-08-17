import mongoose from "mongoose";

export interface OrderItem {
  _id?: string;
  productId: string;
  amount: number;
  perItemPrice: number;
}

export const orderItemSchema = new mongoose.Schema<OrderItem>({
  productId: {
    type: String,
    required: [true, "The product id is required"]
  },
  amount: {
    type: Number,
    required: [true, "The amount is required"],
    min: [1, "The products amount must be greater or equal than 1"]
  },
  perItemPrice: {
    type: Number,
    required: [true, "The price per item is required"],
  },
});

const OrderItemModel = mongoose.model<OrderItem>("OrderItem", orderItemSchema);

export default OrderItemModel;