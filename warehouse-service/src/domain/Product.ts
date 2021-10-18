import Category from "./Category";
import Comment from "./Comment";
import mongoose from "mongoose";

export class Product {
    constructor(
        public _id: string,
        public name: string,
        public pictureUrl: string,
        public category: Category,
        public price: number,
        public averageRating: number,
        public createdAt: Date,
        public comments: Comment[],
    ) { }
}
export class ProductDto {
    public _id: string | null = null;
    public name: string | null = null;
    public category: Category | null = null;
    public price: number | null = null;
    public averageRating: number | null | undefined = null;
    public createdAt: Date | null = null;
    public comments: Comment[];
    public pictureUrl: string | null;

    constructor(product: Product) {
        this._id = product._id;
        this.name = product.name;
        // this.pictureUrl = product.pictureUrl;
        this.category = product.category;
        this.price = product.price;
        this.averageRating = product.averageRating;
        this.createdAt = product.createdAt;
        this.comments = product.comments.map(
            (c) => new Comment(c.title, c.body, c.stars, c.createdAt)
        );
        this.pictureUrl = this._pictureUrl;
    }

    private get _pictureUrl(): string {
        return `/products/${this._id}/picture`;
    }
}

export class Picture {
  public _id: string | null;
  public url: string | null;
  constructor(id: string, url: string) {
    this._id = id;
    this.url = url;
  }
}

const schemaOptions = {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  versionKey: false,
  // id: false
};

const pictureSchemaObj = {
  url: {
      type: mongoose.Schema.Types.String,
      required: [true, "the picture url is required"]
  },
};

const pictureSchema = new mongoose.Schema<Picture>(
  pictureSchemaObj,
  schemaOptions
);

const commentSchemaObj = {
  title: { type: mongoose.Schema.Types.String,
      required: [true, "the comment title is required"]
  },
  body: { type: mongoose.Schema.Types.String,
      required: [true, "the comment body is required"]
  },
  stars: { type: mongoose.Schema.Types.Number,
      required: [true, "the comment stars is required"]
  },
  createdAt: { type: mongoose.Schema.Types.Date,
      required: [true, "the comment creation date is required"]
  },
};

const commentSchema = new mongoose.Schema<Comment>(
  commentSchemaObj,
    {...schemaOptions, timestamps: {createdAt: true, updatedAt: false}}
);

const productSchemaObj = {
  name: { type: mongoose.Schema.Types.String },
  pictureUrl: { type: mongoose.Schema.Types.String },
  category: {
    type: mongoose.Schema.Types.String,
    enum: Object.values(Category),
  },
  price: { type: mongoose.Schema.Types.Number },
  // averageRating: { type: mongoose.Schema.Types.Number },
  createdAt: { type: mongoose.Schema.Types.Date },
  comments: { type: [commentSchema] },
};

const productSchema = new mongoose.Schema<Product>(
  productSchemaObj,
    {...schemaOptions, timestamps: {createdAt: true, updatedAt: false}}
);

productSchema.virtual("averageRating").get(function (this: Product) {
  if (!this.comments.length) return 0;
  return (
    this.comments.reduce((acc, c) => acc + c.stars, 0) / this.comments.length
  );
});

export const ProductModel = mongoose.model<Product>("Product", productSchema, "products");
export const PictureModel = mongoose.model<Picture>("Picture", pictureSchema, "pictures");

// Product: product name, description, picture URL, category, price, average rating and creation date.  Comments with title, body, stars and creation date can be associated to purchased products
