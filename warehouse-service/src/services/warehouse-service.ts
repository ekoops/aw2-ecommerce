import { WarehouseRequestDto } from "../models/Warehouse";
import { WarehouseRepository, warehouseRepository } from "../repositories/warehouse-repository";

export class WarehouseService {
    constructor(private warehouseRepository: WarehouseRepository) {
        this.warehouseRepository = warehouseRepository
    }

    async findWarehouses(filter: {[key: string]: any}): Promise<WarehouseRequestDto[]>  {
        const warehouses: WarehouseRequestDto[] = await this.warehouseRepository.findWarehouses(filter);
        console.log('service: ', warehouses)
        // const warehousesDto = warehouses.map(warehouse => new WarehouseDto(warehouse));
        return warehouses;
    }

    async insertWarehouses(warehousesDto: WarehouseRequestDto[])  {
        const result = await this.warehouseRepository.insertWarehouses(warehousesDto);
        return result;
    }

    async deleteWarehouse(warehouseId: string) {
        return this.warehouseRepository.deleteWarehouse({_id: warehouseId});
    }
}

export const warehouseService = new WarehouseService(warehouseRepository);

