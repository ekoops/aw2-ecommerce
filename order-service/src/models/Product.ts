import mongoose1 from "../db/db-nosql";

export interface Product {
  _id: string;
  productId: number;
  amount: number;
  purchasePrice: number;
}

export const productSchema = new mongoose1.Schema<Product>({
  amount: {
    type: Number,
    min: [1, "The products amount must be greater or equal than 1"],
  },
  purchasePrice: {
    type: Number,
    required: [true, "The purchase price is required"],
  },
});

const ProductModel = mongoose1.model<Product>("Product", productSchema);

export default ProductModel;