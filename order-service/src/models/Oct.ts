import mongoose from "mongoose";

export interface Oct {
  _id: string;
  warehouseHasApproved: boolean;
  walletHasApproved: boolean;
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
});

export const OctModel = mongoose.model<Oct>("Oct", octSchema);
