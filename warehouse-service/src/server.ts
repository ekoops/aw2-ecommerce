import config from "./config/config";
import initDbConnection from "./db/db-nosql";
import app from "./app";
import { productRepository } from "./repositories/product-repository";
import Category from "./models/Category";
import Comment from './models/Comment'
import { productService } from "./services/product-service";


(async () => {
    await new Promise((res: (reason?: any)=>void) => initDbConnection(res));
    console.info('Successful init of db connection')
    await new Promise(res => app.listen(config.server.port, config.server.hostname, () => res(true)))
    console.info(
        `Server is listening on ${config.server.hostname}:${config.server.port}`
    )

    // await productService.insertProducts([
    //     {
    //         name: "test"+Math.random(),
    //         averageRating: 3.2,
    //         category: Category.CAT1,
    //         comments: [
    //             new Comment(
    //                 'Bello',
    //                 'Molto bello',
    //                 5,
    //                 new Date(),
    //             )
    //         ],
    //         creationDate: new Date(),
    //         pictureUrl: '',
    //         price: 19.21
    //     }
    // ])
    // await productService.findProducts({});
})() 

