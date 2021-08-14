import { Request, Response, NextFunction } from "express";
import getOrderService, { OrderService } from "../services/order-service";
import { OrderDTO } from "../models/Order";
import { OrderItemDTO } from "../models/OrderItem";
import { OrderStatus } from "../db/OrderStatus";
import AppError from "../models/AppError";

export class OrderController {
  private static _instance: OrderController;

  private constructor(private orderService: OrderService) {}

  static getInstance(orderService: OrderService) {
    return this._instance || (this._instance = new this(orderService));
  }

  getOrders(req: Request, res: Response, next: NextFunction) {
    this.orderService.getOrders().then((orders) => res.status(200).json(orders));
  }

  getOrder(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    this.orderService.getOrder(id).then((result) => {
      if (result instanceof AppError) {
        // TODO: change 400 status code
        res.status(404).json({});
      } else res.status(200).json(result);
    });
  }

  postOrder(req: Request, res: Response, next: NextFunction) {
    const products: OrderItemDTO[] = req.body.products.map(
      (product: any): OrderItemDTO => ({
        id: product.id,
        amount: product.amount,
      })
    );
    const orderDTO: OrderDTO = {
      buyerId: req.body.buyerId,
      items: items,
    };
    this.orderService
      .addOrder(orderDTO)
      .then((createdOrderDTO) => res.status(201).json(createdOrderDTO));
  }

  patchOrder(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const newStatus = req.body.status as OrderStatus;
    this.orderService.modifyOrderStatus(id, newStatus).then((result) => {
      if (result instanceof AppError) {
        // TODO: change 400 status code
        res.status(400).json({
          error: result.message,
        });
      } else res.status(200).json(result);
    });
  }

  deleteOrder(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    this.orderService
      .deleteOrder(id)
      .then((deleted) => res.status(200).json(deleted));
  }
}

const getOrderController = async (): Promise<OrderController> => {
  const orderService = await getOrderService();
  return new OrderController(orderService);
}

export default getOrderController;
