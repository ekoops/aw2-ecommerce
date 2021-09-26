import {NextFunction, Request, Response} from "express";
import OrderService from "../services/OrderService";
import {OrderStatus} from "../domain/OrderStatus";
import Logger from "../utils/Logger";
import {NotAllowedException, UnauthorizedException,} from "../exceptions/AuthException";
import {OrderItemDTO} from "../domain/OrderItem";
import {OrderDTO} from "../domain/Order";
import {OrderAlreadyCancelledException, OrderNotFoundException,} from "../exceptions/services/OrderServiceException";
import OrderNotFoundResponse from "../responses/OrderNotFoundResponse";
import OrderCancellationNotAllowedResponse from "../responses/OrderCancellationNotAllowedResponse";
import User, {UserRole} from "../domain/User";
import GetOrdersRequestDTO from "../dtos/GetOrdersRequestDTO";
import GetOrderRequestDTO from "../dtos/GetOrderRequestDTO";
import CreateOrderRequestDTO from "../dtos/CreateOrderRequestDTO";
import ModifyOrderStatusRequestDTO from "../dtos/ModifyOrderStatusRequestDTO";
import CancelOrderRequestDTO from "../dtos/CancelOrderRequestDTO";
import OrderStatusUtility from "../utils/OrderStatusUtility";
import UnauthorizedResponse from "../responses/UnauthorizedResponse";
import OrderStatusChangeNotAllowedResponse from "../responses/OrderStatusChangeNotAllowedResponse";
import OrderCreationNotAllowedResponse from "../responses/OrderCreationNotAllowedResponse";

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
      const ordersDTO = await this.orderService.getOrders(
        user as GetOrdersRequestDTO
      );
      res.status(200).json(ordersDTO);
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
      const orderDTO = await this.orderService.getOrder(getOrderRequestDTO);
      if (orderDTO === null) res.status(404).json(new OrderNotFoundResponse(orderId));
      else res.status(200).json(orderDTO);
    } catch (ex) {
      // an exception can be thrown only during db communication, so by invoking next(ex)
      // a 500 internal server error is returned
      next(ex);
    }
  };

  postOrder = async (req: Request, res: Response, next: NextFunction) => {
    const user: User = res.locals.user;

    if (user.role !== UserRole.CUSTOMER) {
      return res.status(403).json(new OrderCreationNotAllowedResponse());
    }

    const itemsDTO: OrderItemDTO[] = req.body.items.map(
      (item: any): OrderItemDTO => ({
        productId: item.productId,
        amount: item.amount,
      })
    );
    const orderDTO: OrderDTO = {
      buyerId: user.id,
      deliveryAddress: user.deliveryAddress!, // if CUSTOMER, deliveryAddress is always present
      items: itemsDTO,
    };

    try {
      const createdOrderDTO = await this.orderService.createOrder(
        orderDTO as CreateOrderRequestDTO
      );
      res.status(201).json(createdOrderDTO);
    } catch (ex) {
      next(ex);
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
      const updatedOrderDTO = await this.orderService.modifyOrderStatus(
        modifyOrderStatusRequestDTO
      );
      res.status(200).json(updatedOrderDTO);
    } catch (ex) {
      if (ex instanceof UnauthorizedException) {
        res.status(401).json(new UnauthorizedResponse());
      } else if (ex instanceof OrderNotFoundException) {
        res.status(404).json(new OrderNotFoundResponse(orderId));
      } else if (ex instanceof NotAllowedException) {
        res.status(403).end(new OrderStatusChangeNotAllowedResponse(orderId, newStatus));
      } else {
        // a different type of exception from the previous ones can be throw only during
        // db communication, so by invoking next(ex), a 500 internal server error is returned
        next(ex);
      }
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
      if (ex instanceof OrderNotFoundException) {
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
