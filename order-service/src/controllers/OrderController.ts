import {NextFunction, Request, Response} from "express";
import OrderService from "../services/OrderService";
import {OrderStatus} from "../domain/OrderStatus";
import Logger from "../utils/Logger";
import {NotAllowedException, UnauthorizedException,} from "../exceptions/AuthException";
import {OrderItemDTO} from "../domain/OrderItem";
import {OrderDTO} from "../domain/Order";
import {OrderAlreadyCancelledException, OrderNotFoundException,} from "../exceptions/services/OrderServiceException";
import OrderNotFoundResponse from "../responses/OrderNotFoundResponse";
import OrderDeletionNotAllowedResponse from "../responses/OrderDeletionNotAllowedResponse";
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
import OrderCreationFailed from "../domain/OrderCreationFailed";
import InternalServerErrorResponse from "../responses/InternalServerErrorResponse";
import { ApplicationException } from "../exceptions/kafka/communication/application/ApplicationException";
import {CannotProduceException} from "../exceptions/kafka/communication/ProducerException";
import BadRequestResponse from "../responses/BadRequestResponse";

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
    console.log('Got user: ', user);

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
      const result = await this.orderService.createOrder(
        orderDTO as CreateOrderRequestDTO
      );
      if (result instanceof ApplicationException) {
        res.status(406).json(result).end();
        return;
      }
      console.log("@0@0@0 received response and sending to client: ", orderDTO)
      if (result instanceof OrderCreationFailed) {
        res.status(500).json(new InternalServerErrorResponse()).end();
      }
      else res.status(201).json(result).end();
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
      Logger.error(NAMESPACE, `patchOrder(): bad new status ${newStatus}`);
      res.status(400).json(new BadRequestResponse(`bad new status value ${newStatus}`));
      return;
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
        res.status(403).json(new OrderStatusChangeNotAllowedResponse(orderId, newStatus));
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
      await this.orderService.deleteOrder(cancelOrderRequestDTO);
      res.status(204).end();
    } catch (ex) {
      if (ex instanceof NotAllowedException) {
        res.status(403).json(new OrderDeletionNotAllowedResponse(orderId))
        // res.status(403).json({
        //   error: "Cannot delete this order"
        // });
      } else {
        // a different type of exception from the previous one can be throw only during
        // db communication, so by invoking next(ex), a 500 internal server error is returned
        next(ex);
      }
    }
  };
}
