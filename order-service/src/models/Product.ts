import mongoose from "mongoose";

export interface Product {
  _id: string;
  amount: number;
  purchasePrice: number;
}

export interface ProductDTO {
  id: string;
  amount?: number;
  purchasePrice?: number;
}

export const toProductDTO = (product: Product): ProductDTO => {
  return {
    id: product._id,
    amount: product.amount,
    purchasePrice: product.purchasePrice
  }
}

export const productSchema = new mongoose.Schema<Product>({
  amount: {
    type: Number,
    required: [true, "The amount is required"],
    min: [1, "The products amount must be greater or equal than 1"]
  },
  purchasePrice: {
    type: Number,
    required: [true, "The purchase price is required"],
  },
});

const ProductModel = mongoose.model<Product>("Product", productSchema);

export default ProductModel;