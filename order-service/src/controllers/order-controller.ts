import { Request, Response, NextFunction } from "express";
import OrderService from "../services/order-service";
import { OrderStatus } from "../db/OrderStatus";
import AppError from "../models/AppError";
import { OrderDTO, OrderItemDTO } from "../dtos/DTOs";

export default class OrderController {
  private static _instance: OrderController;

  private constructor(private orderService: OrderService) {}

  static getInstance(orderService: OrderService) {
    return this._instance || (this._instance = new this(orderService));
  }

  getOrders(req: Request, res: Response, next: NextFunction) {
    this.orderService
      .getOrders()
      .then((orders) => res.status(200).json(orders));
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
    const items: OrderItemDTO[] = req.body.items.map(
      (item: any): OrderItemDTO => ({
        productId: item.productId,
        amount: item.amount,
      })
    );
    const orderDTO: OrderDTO = {
      buyerId: req.body.buyerId,
      items: items,
    };
    this.orderService.addOrder(orderDTO).then((result) => {
      if (result instanceof AppError) {
        // TODO: change 400 status code
        res.status(400).json({ error: result.message });
      } else res.status(201).json(result);
    });
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
