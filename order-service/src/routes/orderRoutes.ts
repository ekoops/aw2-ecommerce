import express from "express";
import OrderController from "../controllers/OrderController";
import { validators, checkErrors } from "../security/validators";
import {handleJwt} from "../security/jwt";

const getRouter = (orderController: OrderController) => {
  const router = express.Router();

  router.use(handleJwt);

  router.get("/", validators.getOrders, checkErrors, orderController.getOrders);

  router.get(
    "/:id",
    validators.getOrder,
    checkErrors,
    orderController.getOrder
  );

  router.post(
    "/",
    (req, res, next) => {
      // res.json({
      //   "hello": "world"
      // });
      console.log('User is: ', res.locals?.user);
      // res.end();
      next()
    },
    // validators.postOrder, // TODO: perché da 500 al posto del messaggio errore?
    // checkErrors,
    orderController.postOrder
  );

  //todo fix validator
  router.patch(
    "/:id",
    // validators.patchOrder,
    // checkErrors,
    orderController.patchOrder
  );

  router.delete(
    "/:id",
    validators.deleteOrder,
    checkErrors,
    orderController.deleteOrder
  );
  return router;
};

export default getRouter;
