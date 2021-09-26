import { OrderItem, OrderItemDTO } from "../domain/OrderItem";
import { Order, OrderDTO } from "../domain/Order";
import OrderItemUtility from "./OrderItemUtility";
import OrderStatusUtility from "./OrderStatusUtility";
import {OrderStatus} from "../domain/OrderStatus";

const toOrderDTO = (order: Order): OrderDTO => {
  return {
    id: order._id,
    buyerId: order.buyerId,
    deliveryAddress: order.deliveryAddress,
    status: order.status,
    items: order.items.map(OrderItemUtility.toOrderItemDTO),
    createdAt: order.createdAt,
  };
};

const buildOrder = (orderDTO: OrderDTO): Order | null => {
  const arePricesMissing = orderDTO.items.some(
    (item) => item.perItemPrice === undefined
  );
  if (arePricesMissing) return null;
  return {
    buyerId: orderDTO.buyerId,
    deliveryAddress: orderDTO.deliveryAddress,
    status: OrderStatusUtility.toOrderStatusName(OrderStatus.PENDING),
    warehouseHasApproved: false,
    walletHasApproved: false,
    items: orderDTO.items.map(
      (item: OrderItemDTO): OrderItem => ({
        productId: item.productId,
        amount: item.amount,
        perItemPrice: item.perItemPrice!,
        sources: [],
      })
    ),
  };
};

// assign sources to order items and return a boolean indicating if they have been assigned correctly
const assignSources = (order: Order, orderDTO: OrderDTO): boolean => {
  const itemsDTO = orderDTO.items;
  let isValidAssignment = true;
  order.items.forEach((item) => {
    const itemDTO = itemsDTO.find(
      (itemDTO) => itemDTO.productId === item.productId
    );
    if (
      itemDTO === undefined ||
      itemDTO.sources === undefined ||
      itemDTO.sources.length === 0
    ) {
      isValidAssignment = false;
      return;
    }
    item.sources = itemDTO.sources;
  });
  return isValidAssignment;
};

const OrderUtility = {
  toOrderDTO,
  buildOrder,
  assignSources,
};

export default OrderUtility;
