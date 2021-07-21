import {Request, Response, NextFunction} from "express";
import {orderService, OrderService} from "../services/order-service";


class OrderController {
    private orderService: OrderService;
    constructor(orderService: OrderService) {
        this.orderService = orderService;
    }
    getOrder(req: Request, res: Response, next: NextFunction) {
        const id = +req.params.id;
        const order = orderService.getOrder(id);
        res.json(order);
    }
}

const orderController = new OrderController(orderService);

export default orderController;