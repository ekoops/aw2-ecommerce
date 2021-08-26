import mongoose from "mongoose";

export interface Oct {
  _id: string;
  warehouseHasApproved: boolean;
  walletHasApproved: boolean;
  createdAt: Date,
  updatedAt: Date
}

const octSchema = new mongoose.Schema<Oct>({
  warehouseHasApproved: {
    type: Boolean,
    default: false,
  },
  walletHasApproved: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true
});

export const OctModel = mongoose.model<Oct>("Oct", octSchema);
