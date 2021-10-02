import mongoose from "mongoose";

export interface Source {
  warehouseId: string;
  quantity: number;
}

export type SourceDTO = Source;

export const sourceSchema = new mongoose.Schema<Source>(
  {
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "The warehouse id is required"],
    },
    quantity: {
      type: mongoose.Schema.Types.Number,
      required: [true, "The item quantity is required"],
      min: [1, "The item quantity must be greater or equal than 1"],
    },
  },
  { _id: false }
);

export const SourceModel = mongoose.model<Source>("Source", sourceSchema);
