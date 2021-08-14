import mongoose from "mongoose";

export interface OrderItem {
  _id?: string;
  productId: string;
  amount: number;
  perItemPrice: number;
}

export interface OrderItemDTO {
  id?: string;
  productId: string;
  amount: number;
  perItemPrice?: number;
}

export const toOrderItemDTO = (orderItem: OrderItem): OrderItemDTO => {
  return {
    id: orderItem._id,
    productId: orderItem.productId,
    amount: orderItem.amount,
    perItemPrice: orderItem.perItemPrice
  }
}

export const toOrderItem = (orderItemDTO: OrderItemDTO): OrderItem => {
  // TODO: check nullability
  return {
    _id: orderItemDTO.id,
    productId: orderItemDTO.productId,
    amount: orderItemDTO.amount,
    perItemPrice: orderItemDTO.perItemPrice!
  }
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