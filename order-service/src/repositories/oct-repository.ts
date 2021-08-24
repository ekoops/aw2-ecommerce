import mongoose from "mongoose";
import { Oct, OctModel } from "../models/Oct";
import {
  OctCreationFailedException,
  OctRetrievingFailedException, OctSavingFailedException
} from "../exceptions/repositories/repositories-exceptions";

export default class OctRepository {
  private static _instance: OctRepository;

  private constructor(private readonly OctModel: mongoose.Model<Oct>) {}

  static getInstance(OctModel: mongoose.Model<Oct>) {
    return this._instance || (this._instance = new this(OctModel));
  }

  createOct = async (id: string) => {
    const octModel = new this.OctModel({_id: id});
    try {
      const concreteOct = await octModel.save();
      console.log("CREATE - ", concreteOct);
      return concreteOct;
    } catch (ex) {
      throw new OctCreationFailedException();
    }
  };

  findOctById = async (id: string): Promise<Oct | null> => {
    try {
      const oct = await this.OctModel.findById(id);
      console.log(`FIND BY ID(${id}) - `, oct);
      return oct;
    }
    catch (ex) {
      throw new OctRetrievingFailedException();
    }
  };

   save = (oct: Oct): Promise<Oct> => {
      // @ts-ignore
      return oct.save().catch(() => {throw new OctSavingFailedException()});
  };

  deleteOctById = async (id: string): Promise<boolean> => {
    // const deleteOrder = promisify<FilterQuery<Order>, any>(OrderModel.deleteOne.bind(OrderModel));
    const res = await this.OctModel.deleteOne({ _id: id });
    console.log("DELETE - ", res);
    return res.deletedCount === 1;
  };
}

OctRepository.getInstance(OctModel);
