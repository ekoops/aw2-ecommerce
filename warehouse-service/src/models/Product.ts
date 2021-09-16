import Category from './Category';
import Comment from './Comment'
import mongoose from 'mongoose'

export class Product {

    constructor(
        public _id: string,
        public name: string,
        public pictureUrl: string,
        public category: Category,
        public price: number,
        public averageRating: number,
        public creationDate: Date,
        public comments: Comment[]
    ) { }
}

export class ProductDto {
    public _id: string | null = null;
    public name: string | null = null;
    public pictureUrl: string | null = null;
    public category: Category | null = null;
    public price: number | null = null;
    public averageRating: number | null | undefined = null;
    public creationDate: Date | null = null;
    public comments: Comment[];
    constructor(product: Product) {
        this._id = product._id;
        this.name = product.name;
        this.pictureUrl = product.pictureUrl;
        this.category = product.category;
        this.price = product.price;
        this.averageRating = product.averageRating;
        this.creationDate = product.creationDate;
        this.comments = product.comments.map(c => new Comment(c.title, c.body, c.stars, c.creationDate));
    }
}

const schemaOptions = {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
}

const commentSchemaObj = {
    title: { type: mongoose.Schema.Types.String },
    body: { type: mongoose.Schema.Types.String },
    stars: { type: mongoose.Schema.Types.Number },
    creationDate: { type: mongoose.Schema.Types.Date },
}

const commentSchema = new mongoose.Schema<Comment>(commentSchemaObj, schemaOptions);

const productSchemaObj = {
    name: { type: mongoose.Schema.Types.String },
    pictureUrl: { type: mongoose.Schema.Types.String },
    category: { type: mongoose.Schema.Types.String, enum: Object.values(Category) },
    price: { type: mongoose.Schema.Types.Number },
    // averageRating: { type: mongoose.Schema.Types.Number },
    creationDate: { type: mongoose.Schema.Types.Date },
    comments: { type: [commentSchema] },
}

const productSchema = new mongoose.Schema<Product>(productSchemaObj, schemaOptions);

productSchema.virtual("averageRating").get(function (this: Product) {
    if (!this.comments.length) return 0;
    return this.comments.reduce((acc, c) => acc + c.stars, 0) / this.comments.length;
});  

export const ProductModel = mongoose.model<Product>("Product", productSchema);



// Product: product name, description, picture URL, category, price, average rating and creation date.  Comments with title, body, stars and creation date can be associated to purchased products  