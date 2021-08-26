import mongoose from "mongoose";
import { Oct, OctModel } from "../models/Oct";
import {
  OctCreationFailedException,
  OctDeletionFailedException,
  OctRetrievingFailedException,
  OctSavingFailedException,
} from "../exceptions/repositories/repositories-exceptions";
import Logger from "../utils/logger";

const NAMESPACE = "OCT_REPOSITORY";

export default class OctRepository {
  private static _instance: OctRepository;

  private constructor(private readonly OctModel: mongoose.Model<Oct>) {}

  static getInstance(OctModel: mongoose.Model<Oct>) {
    return this._instance || (this._instance = new this(OctModel));
  }

  createOct = async (id: string) => {
    const octModel = new this.OctModel({ _id: id });
    try {
      const concreteOct = await octModel.save();
      Logger.dev(NAMESPACE, `createOct(id: ${id}): ${concreteOct}`);
      return concreteOct;
    } catch (ex) {
      Logger.error(NAMESPACE, `createOct(id: ${id}): ${ex}`);
      throw new OctCreationFailedException();
    }
  };

  findOctById = async (id: string): Promise<Oct | null> => {
    try {
      const oct = await this.OctModel.findById(id);
      Logger.dev(NAMESPACE, `findOctById(id: ${id}): ${oct}`);
      return oct;
    } catch (ex) {
      Logger.error(NAMESPACE, `findOctById(id: ${id}): ${ex}`);
      throw new OctRetrievingFailedException();
    }
  };

  save = async (oct: Oct): Promise<Oct> => {
    try {
      // @ts-ignore
      const updatedOct = await oct.save();
      Logger.dev(NAMESPACE, `save(oct: ${oct}): ${updatedOct}`);
      return updatedOct;
    } catch (ex) {
      Logger.error(NAMESPACE, `save(oct: ${oct}): ${ex}`);
      throw new OctSavingFailedException();
    }
  };

  deleteOctById = async (id: string): Promise<boolean> => {
    try {
      const res = await this.OctModel.deleteOne({ _id: id });
      Logger.log(NAMESPACE, `deleteOctById(id: ${id}): ${JSON.stringify(res)}`);
      return res.deletedCount === 1;
    } catch (ex) {
      Logger.error(NAMESPACE, `deleteOctById(id: ${id}): ${ex}`);
      throw new OctDeletionFailedException();
    }
  };
}

OctRepository.getInstance(OctModel);
