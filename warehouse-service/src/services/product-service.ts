import { ProductDto, Product } from "../models/Product";
import { productRepository, ProductRepository } from "../repositories/product-repository";


export class ProductService {
    constructor(private productRepository: ProductRepository) {
        this.productRepository = productRepository
    }

    async findProducts(filter: {[key: string]: string}): Promise<ProductDto[]>  {
        const products: Product[] = await productRepository.findProducts(filter);
        console.log('service: ', products)
        const productsDto = products.map(product => new ProductDto(product));
        return productsDto;
    }

    async insertProducts(productsDto: ProductDto[])  {
        const result = await productRepository.insertProducts(productsDto as Product[]);
        return result;
    }
}


export const productService = new ProductService(productRepository);
