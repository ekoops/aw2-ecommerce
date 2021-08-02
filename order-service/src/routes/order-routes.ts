import express from "express";
import orderController from "../controllers/order-controller";
import { validators, checkErrors } from "../validators";

const router = express.Router();

router.get("/", validators.getOrders, checkErrors, orderController.getOrders);

router.get("/:id", validators.getOrder, checkErrors, orderController.getOrder);

router.post(
  "/",
  validators.postOrder,
  checkErrors,
  orderController.postOrder
);

router.patch(
  "/:id",
  validators.patchOrder,
  checkErrors,
  orderController.patchOrder
);

router.delete(
  "/:id",
  validators.deleteOrder,
  checkErrors,
  orderController.deleteOrder
);

export = router;
