import { ProductDto, Product, Picture } from "../domain/Product";
import { WarehouseRequestDto } from "../domain/Warehouse";
import ProductRepository from "../repositories/ProductRepository";
import {OrderItemDTO} from "../domain/OrderItem";

export default class ProductService {
  private static _instance: ProductService;

  constructor(private productRepository: ProductRepository) {}

  static getInstance(productRepository: ProductRepository) {
    return this._instance || (this._instance = new this(productRepository));
  }

  findProducts = async (filter: {
    [key: string]: any;
  }): Promise<ProductDto[]> => {
    const products: Product[] = await this.productRepository.findProducts(
      filter
    );
    console.log("service: ", products);
    const productsDto = products.map((product) => new ProductDto(product));
    return productsDto;
  };

  insertProducts = async (productsDto: ProductDto[]) => {
    const result = await this.productRepository.insertProducts(
      productsDto as Product[]
    );
    return result;
  };

  postPicture = async (picture: Picture) =>
    this.productRepository.postPicture(picture);

  getPicture = async (filter: { _id: string }) =>
    this.productRepository.getPicture(filter);

  deleteProduct = async (filter: { [key: string]: string }) =>
    this.productRepository.deleteProduct(filter);

  updateProduct = async (
    filter: { [key: string]: string },
    newProduct: ProductDto
  ) => this.productRepository.updateProduct(filter, newProduct as Product);

  fillWarehouseProducts = async (warehousesList: WarehouseRequestDto[]) => {
    const warehousesProductPromises = warehousesList.map(async (w) => {
      const idsList = w.products?.map((p) => p.product._id);
      const productsQuery = {
        _id: {
          $in: idsList,
        },
      };

      return this.findProducts(productsQuery);
    });

    const allProducts = await Promise.all(warehousesProductPromises);
    console.log('allProducts is ', allProducts);
    const warehousesWithProducts = warehousesList.map((w, index) => {
      allProducts[index].forEach((p, index_j) => {
        if (w.products) {
          console.log(w.products[index_j], p);
          const k = {
            quantity: w.products[index_j].quantity,
            product: p
          };
          // @ts-ignore
          w.products[index_j] = k;
        }
      });
      return w;
    });

    return warehousesWithProducts;
  };

  addProductsPrices = async (products: OrderItemDTO[]): Promise<boolean> => {
    if (products.length === 0) return false;

    const productIdsList = products.map(
        (product: OrderItemDTO) => product.productId
    );

    const result: Product[] = await this.productRepository.findProducts({});
    console.log('result of findProducts is', result);

    // if (result.length !== products.length) return false;

    for (const product of products) {
      const p: Product | undefined = result.find(p => p._id === product.productId);
      if (p === undefined) return false;
      product.perItemPrice = p.price;
    }
    return true;
  };


}
