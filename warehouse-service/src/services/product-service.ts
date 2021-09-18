import { ProductDto, Product, Picture } from "../models/Product";
import { productRepository, ProductRepository } from "../repositories/product-repository";


export class ProductService {
    constructor(private productRepository: ProductRepository) {
        this.productRepository = productRepository
    }

    async findProducts(filter: {[key: string]: any}): Promise<ProductDto[]>  {
        const products: Product[] = await productRepository.findProducts(filter);
        console.log('service: ', products)
        const productsDto = products.map(product => new ProductDto(product));
        return productsDto;
    }

    async insertProducts(productsDto: ProductDto[])  {
        const result = await productRepository.insertProducts(productsDto as Product[]);
        return result;
    }

    async postPicture(picture: Picture) {
        return productRepository.postPicture(picture);
    }

    async getPicture(filter: {_id: string}) {
        return productRepository.getPicture(filter);
    }

    async deleteProduct(filter: {[key: string]: string}) {
        return productRepository.deleteProduct(filter);
    }

    async updateProduct(filter: {[key: string]: string}, newProduct: ProductDto) {
        return productRepository.updateProduct(filter, newProduct as Product);
    }
}


export const productService = new ProductService(productRepository);
