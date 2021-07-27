import {Request, Response, NextFunction} from "express";
import {orderService, OrderService} from "../services/order-service";
import {OrderDTO} from "../models/Order";
import {ProductDTO} from "../models/Product";

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
        const result: OrderDTO | null = await orderService.getOrder(id);
        if (result === null) {
            // TODO: change 400 status code
            res.status(404).json({});
        }
        else res.status(200).json(result);
    }

    async postOrder(req: Request, res: Response, next: NextFunction) {
        const products: ProductDTO[] = req.body.products.map((product: any): ProductDTO => ({
            id: product.id,
            amount: product.amount
        }));
        const orderDTO: OrderDTO = {
            buyerId: req.body.buyerId,
            products
        };
        const result: OrderDTO | null = await orderService.addOrder(orderDTO);
        if (result === null) {
            // TODO: change 400 status code
            res.status(400).json({error: "error"});
        }
        else res.status(201).json(result);

    }
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