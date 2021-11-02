import mongoose, {FilterQuery} from 'mongoose';
import { Picture, PictureModel, Product, ProductModel } from '../domain/Product';

export type InsertionResult = (Product & mongoose.Document<any, any, Product>)[];
export type DeletionResult = ({ok?: number | undefined; n?: number | undefined;} & { deletedCount?: number | undefined; })

export default class ProductRepository {
  private static _instance: ProductRepository;

  constructor(
    private ProductModel: mongoose.Model<Product>,
    private PictureModel: mongoose.Model<Picture>
  ) {}

  static getInstance(
    ProductModel: mongoose.Model<Product>,
    PictureModel: mongoose.Model<Picture>
  ) {
    return (
      this._instance || (this._instance = new this(ProductModel, PictureModel))
    );
  }

  findProducts = async (filter: FilterQuery<Product>): Promise<Product[]> => {
    console.log(filter);
    const products = await this.ProductModel.find(filter);
    console.log("Found: ", products);
    return products;
  };

  insertProducts = async (products: Product[]): Promise<InsertionResult> => {
    const result = await this.ProductModel.insertMany(products);
    console.log("Inserted ", result);
    return result;
  };

  postPicture = async (picture: Picture): Promise<any> =>
    this.PictureModel.updateOne({ _id: picture._id }, { url: picture.url });

  getPicture = async (filter: { _id: string }): Promise<any> =>
    this.PictureModel.find(filter);

  deleteProduct = async (filter: {
    [key: string]: string;
  }): Promise<DeletionResult> => {
    const result = await this.ProductModel.deleteOne(filter);
    console.log("Deleted ", result);
    return result;
  };

  updateProduct = async (
    filter: { [key: string]: string },
    product: Product
  ): Promise<DeletionResult> => {
    const result = await this.ProductModel.updateOne(filter, product);
    console.log("Updated ", result);
    return result;
  };
};
