import mongoose from 'mongoose';
import { Warehouse, WarehouseModel, WarehouseRequestDto } from '../models/Warehouse';

export type InsertionResult = (WarehouseRequestDto & mongoose.Document<any, any, WarehouseRequestDto>)[];
export type DeletionResult = ({ok?: number | undefined; n?: number | undefined;} & { deletedCount?: number | undefined; })

export class WarehouseRepository {
    constructor(
        private WarehouseModel: mongoose.Model<WarehouseRequestDto>
        ) { }

    async findWarehouses(filter: {[key: string]: string}): Promise<WarehouseRequestDto[]> {
        console.log(filter);
        const warehouses = await this.WarehouseModel.find(filter);
        console.log('Found: ', warehouses);
        return warehouses;
    }

    async insertWarehouses(warehouses: WarehouseRequestDto[]): Promise<InsertionResult> {
        const result = await this.WarehouseModel.insertMany(warehouses);
        console.log('Inserted ', result);
        return result;
    }

    async deleteWarehouse(filter: {[key: string]: string}): Promise<DeletionResult> {
        const result = await this.WarehouseModel.deleteOne(filter);
        console.log('Deleted ', result);
        return result;
    }

    async updateWarehouse(filter: {[key: string]: string}, warehouse: Warehouse): Promise<DeletionResult> {
        const result = await this.WarehouseModel.updateOne(filter, warehouse);
        console.log('Updated ', result);
        return result;
    }
}

export const warehouseRepository = new WarehouseRepository(WarehouseModel);
