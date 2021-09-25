import { NextFunction, Request, Response } from "express";
import OrderService from "../services/OrderService";
import { OrderStatus } from "../domain/OrderStatus";
import Logger from "../utils/Logger";
import {
  NotAllowedException,
  UnauthorizedException,
} from "../exceptions/AuthException";
import { OrderItemDTO } from "../domain/OrderItem";
import { OrderDTO } from "../domain/Order";
import {
  OrderAlreadyCancelledException,
  OrderNotExistException,
} from "../exceptions/services/OrderServiceException";
import OrderNotFoundResponse from "../responses/OrderNotFoundResponse";
import OrderCancellationNotAllowedResponse from "../responses/OrderCancellationNotAllowedResponse";
import User from "../domain/User";
import GetOrdersRequestDTO from "../dtos/GetOrdersRequestDTO";
import GetOrderRequestDTO from "../dtos/GetOrderRequestDTO";
import CreateOrderRequestDTO from "../dtos/CreateOrderRequestDTO";
import ModifyOrderStatusRequestDTO from "../dtos/ModifyOrderStatusRequestDTO";
import CancelOrderRequestDTO from "../dtos/CancelOrderRequestDTO";
import OrderStatusUtility from "../utils/OrderStatusUtility";
import UnauthorizedResponse from "../responses/UnauthorizedResponse";

const NAMESPACE = "ORDER_CONTROLLER";

export default class OrderController {
  private static _instance: OrderController;

  private constructor(private orderService: OrderService) {}

  static getInstance(orderService: OrderService) {
    return this._instance || (this._instance = new this(orderService));
  }

  getOrders = async (req: Request, res: Response, next: NextFunction) => {
    const user: User = res.locals.user;
    try {
      const orders = await this.orderService.getOrders(
        user as GetOrdersRequestDTO
      );
      res.status(200).json(orders);
    } catch (ex) {
      // an exception can be thrown only during db communication, so by invoking next(ex)
      // a 500 internal server error is returned
      next(ex);
    }
  };

  getOrder = async (req: Request, res: Response, next: NextFunction) => {
    const { id: orderId } = req.params;
    const user: User = res.locals.user;
    const getOrderRequestDTO: GetOrderRequestDTO = {
      orderId,
      user,
    };

    try {
      const order = await this.orderService.getOrder(getOrderRequestDTO);
      if (order === null) res.status(404).json(new OrderNotFoundResponse(orderId));
      else res.status(200).json(order);
    } catch (ex) {
      // an exception can be thrown only during db communication, so by invoking next(ex)
      // a 500 internal server error is returned
      next(ex);
    }
  };

  postOrder = async (req: Request, res: Response, next: NextFunction) => {
    const user: User = res.locals.user;
    if (user.deliveryAddress === undefined) {
      return res.status(401).json(new UnauthorizedResponse());
    }

    const items: OrderItemDTO[] = req.body.items.map(
      (item: any): OrderItemDTO => ({
        productId: item.productId,
        amount: item.amount,
      })
    );
    const orderDTO: OrderDTO = {
      buyerId: user.id,
      deliveryAddress: user.deliveryAddress,
      items,
    };

    try {
      const result = await this.orderService.createOrder(
        orderDTO as CreateOrderRequestDTO
      );
      res.status(201).json(result);
    } catch (ex) {
      if (ex instanceof UnauthorizedException) {
      } else next(ex);
    }
  };

  patchOrder = async (req: Request, res: Response, next: NextFunction) => {
    const { id: orderId } = req.params;
    const user: User = res.locals.user;
    const newStatus: OrderStatus | undefined = OrderStatusUtility.toOrderStatus(
      req.body.status
    );
    if (newStatus === undefined) {
      Logger.error(NAMESPACE, "patchOrder(): bad status _", newStatus);
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
        "request for service: modifyOrderStatus(modifyOrderStatusRequestDTO: _...",
        modifyOrderStatusRequestDTO
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
      } else next(ex);
    }
  };

  deleteOrder = async (req: Request, res: Response, next: NextFunction) => {
    const { id: orderId } = req.params;
    const user: User = res.locals.user;
    const cancelOrderRequestDTO: CancelOrderRequestDTO = {
      orderId,
      user,
    };
    try {
      await this.orderService.cancelOrder(cancelOrderRequestDTO);
      res.status(204).end();
    } catch (ex) {
      if (ex instanceof OrderNotExistException) {
        res.status(404).json(new OrderNotFoundResponse(orderId));
      } else if (ex instanceof OrderAlreadyCancelledException) {
        res.status(204).end();
      } else if (ex instanceof NotAllowedException) {
        res.status(403).end(new OrderCancellationNotAllowedResponse(orderId));
      } else {
        // a different type of exception from the previous ones can be throw only during
        // db communication, so by invoking next(ex), a 500 internal server error is returned
        next(ex);
      }
    }
  };
}
