import {orderRepository, OrderRepository} from "../repositories/order-repository";

export class OrderService {
    orderRepository: OrderRepository
    constructor(orderRepository: OrderRepository) {
        this.orderRepository = orderRepository;
    }
    getOrder(id: number) {
        return orderRepository.findOrderById(id);
    }
}

export const orderService = new OrderService(orderRepository);