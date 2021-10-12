import mongoose, { ClientSession } from "mongoose";
import {Warehouse, WarehouseRequestDto} from "../domain/Warehouse";
import {Product} from "../domain/Product";
import {Source} from "../domain/Source";
import {DbTransactionFailedException} from "../exceptions/db/DbException";

export type InsertionResult = (WarehouseRequestDto &
    mongoose.Document<any, any, WarehouseRequestDto>)[];
export type DeletionResult = {
    ok?: number | undefined;
    n?: number | undefined;
} & { deletedCount?: number | undefined };

export default class WarehouseRepository {
    private static _instance: WarehouseRepository;

    constructor(
        private WarehouseModel: mongoose.Model<Warehouse>,
        private ProductModel: mongoose.Model<Product>
    ) {}

    static getInstance(
        WarehouseModel: mongoose.Model<Warehouse>,
        ProductModel: mongoose.Model<Product>
    ) {
        return (
            this._instance ||
            (this._instance = new this(WarehouseModel, ProductModel))
        );
    }

    findWarehouses = async (filter: {
        [key: string]: string;
    }): Promise<Warehouse[]> => {
        console.log(filter);
        const warehouses = await this.WarehouseModel.find(filter);
        console.log("Found: ", warehouses);
        return warehouses;
    };

    insertWarehouses = async (
        warehouses: WarehouseRequestDto[]
    ): Promise<InsertionResult> => {
        const result = await this.WarehouseModel.insertMany(warehouses);
        console.log("Inserted ", result);
        return result;
    };

    deleteWarehouse = async (filter: {
        [key: string]: string;
    }): Promise<DeletionResult> => {
        const result = await this.WarehouseModel.deleteOne(filter);
        console.log("Deleted ", result);
        return result;
    };

    getProductsAvailability = async (
        productIdsList: string[]
    ): Promise<{ [key: string]: number }> => {
        const pipeline = [
            { $unwind: "$products" },
            { $match: { "product._id": { $in: productIdsList } } },
            {
                $group: {
                    _id: "$product._id",
                    totalAmount: { $sum: "$amount" },
                },
            },
        ];
        try {
            const products: any[] = await this.WarehouseModel.aggregate(pipeline);
            let productsAvailability: { [key: string]: number } = {};
            products.forEach(
                (product) => (productsAvailability[product._id] = product.totalAmount)
            );
            return productsAvailability;
        } catch (ex) {
            return {};
        }
    };

    getPerProductWarehousesAndQuantities = async (productIdsList: string[]) => {
        const pipeline = [
            { $project: { name: 0 } },
            { $unwind: "$products" },
            { $match: { "product._id": { $in: productIdsList } } },
            {
                $group: {
                    _id: "$product._id",
                    warehouses: { $push: { warehouseId: "$_id", quantity: "$quantity" } },
                },
            },
        ];
        // the result should have the following form:
        // [
        //   {
        //     _id: product_id1,
        //     warehouses: [
        //         {warehouseId: warehouseId1, quantity: quantity1]},
        //         {warehouseId: warehouseId2, quantity: quantity2]}
        //         ...
        //     ]
        //   },
        //   ...
        // ]
        try {
            const products = await this.WarehouseModel.find({});
            

            const result = await this.WarehouseModel.aggregate(pipeline);
            console.log('Result of aggregate is: ', result);
            let productsLocations: { [key: string]: Source[] } = {};
            result.forEach(
                (e) => (productsLocations[e._id.toString()] = e.warehouses)
            );
            console.log('returning productLocations: ', productsLocations);
            return productsLocations;
        } catch (ex) {
            console.log('Error in repository: ', ex);
            return {};
        }
    };

    removeWarehousesProducts = async (
        perWarehouseProductsQuantities: any,
        session: ClientSession
    ): Promise<boolean> => {
        const pwpq = perWarehouseProductsQuantities;
        try {
            for (const warehouseId of Object.keys(pwpq)) {
                for (const { productId, quantity } of pwpq[warehouseId]) {
                    const warehouse = await this.WarehouseModel.findOne(
                        {
                            _id: warehouseId,
                            "products.$.product._id": productId,
                        },
                        null,
                        { session }
                    );
                    if (
                        warehouse === null ||
                        warehouse.products === null ||
                        warehouse.products.length !== 1 ||
                        warehouse.products[0].quantity < quantity
                    ) {
                        throw new DbTransactionFailedException();
                    }
                    await this.WarehouseModel.updateOne(
                        { _id: warehouseId, "products.$.product._id": productId },
                        { $inc: { "products.$.quantity": -quantity } },
                        { session }
                    );
                }
            }
            return true;
        } catch (ex) {
            console.log(ex)
            return false;
        }
    };
    addWarehousesProducts = async (
        perWarehouseProductsQuantities: any,
        session: ClientSession
    ): Promise<boolean> => {
        const pwpq = perWarehouseProductsQuantities;
        try {
            for (const warehouseId of Object.keys(pwpq)) {
                for (const { productId, quantity } of pwpq[warehouseId]) {
                    const warehouse = await this.WarehouseModel.findOne(
                        {
                            _id: warehouseId,
                            "products.$.product._id": productId,
                        },
                        null,
                        { session }
                    );
                    if (
                        warehouse === null ||
                        warehouse.products === null ||
                        warehouse.products.length !== 1 ||
                        warehouse.products[0].quantity < quantity
                    ) {
                        throw new DbTransactionFailedException();
                    }
                    await this.WarehouseModel.updateOne(
                        { _id: warehouseId, "products.$.product._id": productId },
                        { $inc: { "products.$.quantity": quantity } },
                        { session }
                    );
                }
            }
            return true;
        } catch (ex) {
            return false;
        }
    };
}
