import initDbConnection from "./db/initDbConnection";
import { RequestOptions } from "http";
import OrderStatusUtility from "./utils/OrderStatusUtility";
import { OrderStatus } from "./db/OrderStatus";
import getData from "./getData";
import OrderRepository from "./repositories/OrderRepository";
import {Order, OrderDTO, OrderModel} from "./domain/Order";
import OrderService from "./services/OrderService";
import {Warehouse, WarehouseModel} from "./domain/Warehouse";
import WarehouseService from "./services/WarehouseService";
import WarehouseRepository from "./repositories/WarehouseRepository";

const INTERVAL = 10 * 60 * 1000; // 10 minutes
const NAMESPACE = "CLEANER";

const PENDING_STATUS = OrderStatusUtility.toOrderStatusName(
  OrderStatus.PENDING
);
const FAILED_STATUS = OrderStatusUtility.toOrderStatusName(OrderStatus.FAILED);

const warehouseRepository = WarehouseRepository.getInstance(WarehouseModel);
const warehouseService = WarehouseService.getInstance(warehouseRepository);

const orderRepository = OrderRepository.getInstance(OrderModel);
const orderService = OrderService.getInstance(orderRepository, warehouseService);


const handleOrderData = (
  order: Order,
  orderDTO: OrderDTO | null | undefined
) => {
  if (orderDTO === undefined) return;
  // l'ordine non esiste più oppure è fallito: ripristinare prodotti magazzino
  if (orderDTO === null || order.status === FAILED_STATUS) {
    return orderService.handleOrderDeletion(orderDTO!.id!);
  }

  // lo stato non è nè pending nè failed... devo aggiornare lo stato
  // per riflettere le modifiche presenti nel db principale
  if (order.status !== PENDING_STATUS) {
    order.status = orderDTO.status!;

    // @ts-ignore
    order.save().catch(() => {
      // non devo fare nulla... non è importante che il salvataggio
      // vada a buon fine: in caso riproverò successivamente
    });
  }
};

const cleanWarehouse = async () => {
  try {
    // TODO: cambiare filter: prelevare soltanto ordini pendenti da più di un certo periodo
    const pendingOrders = await OrderModel.find({ status: PENDING_STATUS });
    for (const order of pendingOrders) {
      const requestOptions: RequestOptions = {
        host: "order-svc",
        path: `/api/v1/orders/${order._id}`,
        headers: { "Content-Type": "application/json" },
        method: "GET",
      };
      getData<OrderDTO>(requestOptions, handleOrderData.bind(null, order));
    }
  } catch (ex) {
    // TODO: probably nothing to do...
  }
};

const handler = async () => {
  const startProcess = Date.now();
  const nextTimerFire = startProcess + INTERVAL;

  await cleanWarehouse();

  const endProcess = Date.now();
  setTimeout(handler, nextTimerFire - endProcess);
};

const run = async () => {
  await initDbConnection();

  await handler();
};

run().catch(() => {});
