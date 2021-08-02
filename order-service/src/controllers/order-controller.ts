import { Request, Response, NextFunction } from "express";
import { orderService, OrderService } from "../services/order-service";
import { OrderDTO } from "../models/Order";
import { ProductDTO } from "../models/Product";
import { OrderStatus } from "../db/OrderStatus";
import AppError from "../models/AppError";

class OrderController {
  constructor(private orderService: OrderService) {}

  getOrders(req: Request, res: Response, next: NextFunction) {
    orderService.getOrders().then((orders) => res.status(200).json(orders));
  }

  getOrder(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    orderService.getOrder(id).then((result) => {
      if (result instanceof AppError) {
        // TODO: change 400 status code
        res.status(404).json({});
      } else res.status(200).json(result);
    });
  }

  postOrder(req: Request, res: Response, next: NextFunction) {
    const products: ProductDTO[] = req.body.products.map(
      (product: any): ProductDTO => ({
        id: product.id,
        amount: product.amount,
      })
    );
    const orderDTO: OrderDTO = {
      buyerId: req.body.buyerId,
      products,
    };
    orderService
      .addOrder(orderDTO)
      .then((createdOrderDTO) => res.status(201).json(createdOrderDTO));
  }

  patchOrder(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const newStatus = req.body.status as OrderStatus;
    orderService.modifyOrderStatus(id, newStatus).then((result) => {
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
    orderService
      .deleteOrder(id)
      .then((deleted) => res.status(200).json(deleted));
  }
}

const orderController = new OrderController(orderService);

export default orderController;
