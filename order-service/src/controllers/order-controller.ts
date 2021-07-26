import {Request, Response, NextFunction} from "express";
import {orderService, OrderService} from "../services/order-service";
import {OrderDTO} from "../models/Order";

class OrderController {
    private orderService: OrderService;
    constructor(orderService: OrderService) {
        this.orderService = orderService;
    }

    async getOrders(req: Request, res: Response, next: NextFunction) {
        const orders: OrderDTO[] = await orderService.getOrders();
        res.json(orders);
    }

    async getOrder(req: Request, res: Response, next: NextFunction) {
        const {id} = req.params;
        const order: OrderDTO | null = await orderService.getOrder(id);
        res.json(order);
    }

    // postOrder(req: Request, res: Response, next: NextFunction) {
    //     orderService.addOrder();
    // }
    // patchOrder(req: Request, res: Response, next: NextFunction) {
    //     const id = +req.params.id;
    //     const order = orderService.modifyOrder(id);
    //     res.json(order);
    // }
    async deleteOrder(req: Request, res: Response, next: NextFunction) {
        const {id} = req.params;
        const deleted: boolean = await orderService.deleteOrder(id);
        res.json({deleted});
    }
}

const orderController = new OrderController(orderService);

export default orderController;