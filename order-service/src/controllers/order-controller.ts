import { Request, Response, NextFunction } from "express";
import OrderService from "../services/order-service";
import { OrderStatus } from "../db/OrderStatus";
import AppError from "../models/AppError";
import {
  DeleteOrderRequestDTO,
  GetOrderRequestDTO,
  OrderDTO,
  OrderItemDTO,
  PatchOrderRequestDTO,
  User
} from "../dtos/DTOs";
import {OrderNotExistException, UnauthorizedException} from "../exceptions/exceptions";


export default class OrderController {
  private static _instance: OrderController;

  private constructor(private orderService: OrderService) {}

  static getInstance(orderService: OrderService) {
    return this._instance || (this._instance = new this(orderService));
  }

  async getOrders(req: Request, res: Response, next: NextFunction) {
    const user: User = res.locals.user;
    try {
      const orders = await this.orderService.getOrders(user);
      res.status(200).json(orders);
    }
    catch (ex) {
      if (ex instanceof UnauthorizedException) {
        res.status(401).end();
      }
      else throw ex;
    }
  }

  async getOrder(req: Request, res: Response, next: NextFunction) {
    const { id : orderId } = req.params;
    const user: User = res.locals.user;
    const getOrderRequestDTO: GetOrderRequestDTO = {
      orderId,
      user
    }
    try {
      const order = await this.orderService.getOrder(getOrderRequestDTO);
      if (order === null) res.status(404).json();
      else res.status(200).json(order);
    }
    catch (ex) {
      if (ex instanceof UnauthorizedException) {
        res.status(401).end();
      } else if (ex instanceof OrderNotExistException) {
        res.status(404).end();
      }
      else throw ex;
    }

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
    const { id : orderId} = req.params;
    const user: User = res.locals.user;
    const newStatus = req.body.status as OrderStatus;

    const patchOrderRequestDTO: PatchOrderRequestDTO = {
      orderId,
      user,
      newStatus // TODO
    };
    this.orderService.modifyOrderStatus(patchOrderRequestDTO).then((result) => {
      if (result instanceof AppError) {
        // TODO: change 400 status code
        res.status(400).json({
          error: result.message,
        });
      } else res.status(200).json(result);
    });
  }

  async deleteOrder(req: Request, res: Response, next: NextFunction) {
    const { id : orderId } = req.params;
    const user: User = res.locals.user;
    const deleteOrderRequestDTO: DeleteOrderRequestDTO = {
      orderId,
      user
    }
    try {
      await this.orderService.deleteOrder(deleteOrderRequestDTO);
      res.status(204).end();
    }
    catch (ex) {
      if (ex instanceof UnauthorizedException) {
        res.status(401).end();
      } else if (ex instanceof OrderNotExistException) {
        res.status(404).end();
      }
      else throw ex;
    }
  }
}
