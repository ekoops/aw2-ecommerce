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
    await new Promise(res => app.listen(config.server.port, () => res(true)))
    console.info(
        `Server is listening on port ${config.server.port}`
    )
})() 

