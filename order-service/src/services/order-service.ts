import {orderRepository, OrderRepositoryNosql} from "../repositories/order-repository-nosql";
import {OrderDTO, toOrderDTO} from "../models/Order";

export class OrderService {
    orderRepository: OrderRepositoryNosql
    constructor(orderRepository: OrderRepositoryNosql) {
        this.orderRepository = orderRepository;
    }
    async getOrder(id: string): Promise<OrderDTO | null> {
        try {
            const order = await orderRepository.findOrderById(id);
            if (order === null) return null;
            return toOrderDTO(order);
        }
        catch (ex) {
            // TODO handle exception
            return null;
        }
    }

    async getOrders(): Promise<OrderDTO[]> {
        try {
            const orders = await orderRepository.findAllOrders();
            return orders.map(toOrderDTO);
        }
        catch (ex) {
            // TODO handle exception
            return [];
        }
    }

    // async addOrder(order: OrderDTO) {
    //     try {
    //         // TODO
    //     }
    //     catch (ex) {
    //         // TODO
    //     }
    //     return {};
    //     // return orderRepository.createOrder(order);
    // }
    //
    // modifyOrder(order: OrderDTO) {
    //     return {};
    //     // return orderRepository.updateOrder(order);
    // }

    async deleteOrder(id: string): Promise<boolean> {
        try {
            return await orderRepository.deleteOrderById(id)
        }
        catch (ex) {
            // TODO handle exception
            return false;
        }
    }
}

export const orderService = new OrderService(orderRepository);