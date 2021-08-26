import { NextFunction, Request, Response } from "express";
import OrderService from "../services/order-service";
import { OrderStatus, toOrderStatus } from "../db/OrderStatus";
import FailureWrapper from "../models/FailureWrapper";
import {
  DeleteOrderRequestDTO,
  GetOrderRequestDTO, GetOrdersRequestDTO,
  OrderDTO,
  OrderItemDTO,
  ModifyOrderStatusRequestDTO,
  User, AddOrderRequestDTO,
} from "../dtos/DTOs";
import {
  NotAllowedException,
  OrderAlreadyCancelledException,
  OrderNotExistException,
  UnauthorizedException,
} from "../exceptions/exceptions";
import Logger from "../utils/logger";

const NAMESPACE = "ORDER_CONTROLLER";

export default class OrderController {
  private static _instance: OrderController;

  private constructor(private orderService: OrderService) {}

  static getInstance(orderService: OrderService) {
    return this._instance || (this._instance = new this(orderService));
  }

  getOrders = async (req: Request, res: Response, next: NextFunction) => {
    const user: User = res.locals.user;
    Logger.dev(NAMESPACE, `request for service: getOrders(user: ${user}`);
    const orders = await this.orderService.getOrders(user as GetOrdersRequestDTO);
    res.status(200).json(orders);
  };

  getOrder = async (req: Request, res: Response, next: NextFunction) => {
    const { id: orderId } = req.params;
    const user: User = res.locals.user;
    const getOrderRequestDTO: GetOrderRequestDTO = {
      orderId,
      user,
    };
    try {
      Logger.dev(
          NAMESPACE,
          `request for service: getOrder(getOrderRequestDTO: ${getOrderRequestDTO}`
      );
      const order = await this.orderService.getOrder(getOrderRequestDTO);
      if (order === null) res.status(404).json();
      else res.status(200).json(order);
    } catch (ex) {
      if (ex instanceof UnauthorizedException) {
        res.status(401).end();
      } else if (ex instanceof OrderNotExistException) {
        res.status(404).end();
      } else throw ex;
    }
  };

  postOrder = async (req: Request, res: Response, next: NextFunction) => {
    const user: User = res.locals.user;
    const items: OrderItemDTO[] = req.body.items.map(
      (item: any): OrderItemDTO => ({
        productId: item.productId,
        amount: item.amount,
      })
    );
    const orderDTO: OrderDTO = {
      buyerId: user.id,
      items,
    };

    try {
      const result = await this.orderService.addOrder(orderDTO as AddOrderRequestDTO);
      res.status(201).json(result);
    }
    catch (ex) {
      if (ex instanceof UnauthorizedException) {

      }
      else throw ex;
    }
  };

  patchOrder = async (req: Request, res: Response, next: NextFunction) => {
    const { id: orderId } = req.params;
    const user: User = res.locals.user;
    const newStatus: OrderStatus | undefined = toOrderStatus(req.body.status);
    if (newStatus === undefined) {
      Logger.error(NAMESPACE, `patchOrder(): bad status ${newStatus}`);
      return res.status(400).json({ reason: `bad status ${newStatus}` });
    }

    const modifyOrderStatusRequestDTO: ModifyOrderStatusRequestDTO = {
      orderId,
      user,
      newStatus,
    };
    try {
      Logger.dev(
        NAMESPACE,
        `request for service: modifyOrderStatus(modifyOrderStatusRequestDTO: ${modifyOrderStatusRequestDTO}`
      );
      const updatedOrder = await this.orderService.modifyOrderStatus(
        modifyOrderStatusRequestDTO
      );
      res.status(200).json(updatedOrder);
    } catch (ex) {
      if (ex instanceof UnauthorizedException) {
        res.status(401).end();
      } else if (ex instanceof OrderNotExistException) {
        res.status(404).end();
      } else if (ex instanceof NotAllowedException) {
        res.status(403).end();
      } else throw ex;
    }
  };

  deleteOrder = async (req: Request, res: Response, next: NextFunction) => {
    const { id: orderId } = req.params;
    const user: User = res.locals.user;
    const deleteOrderRequestDTO: DeleteOrderRequestDTO = {
      orderId,
      user,
    };
    try {
      Logger.dev(
        NAMESPACE,
        `request for service: deleteOrder(deleteRequestDTO: ${deleteOrderRequestDTO}`
      );
      await this.orderService.deleteOrder(deleteOrderRequestDTO);
      res.status(204).end();
    } catch (ex) {
      if (ex instanceof OrderNotExistException) {
        res.status(404).end();
      } else if (ex instanceof UnauthorizedException) {
        res.status(401).end();
      } else if (ex instanceof OrderAlreadyCancelledException) {
        res.status(204).end();
      } else if (ex instanceof NotAllowedException) {
        res.status(403).end();
      } else throw ex;
    }
  };
}
