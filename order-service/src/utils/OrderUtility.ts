import { OrderItem, OrderItemDTO } from "../models/OrderItem";
import { Order, OrderDTO } from "../models/Order";
import OrderItemUtility from "./OrderItemUtility";

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
  // the missing parameters are defaulted in mongoose schema definitions
  const arePricesMissing = orderDTO.items.some(
    (item) => item.perItemPrice === undefined
  );
  if (arePricesMissing) return null;
  return {
    buyerId: orderDTO.buyerId,
    deliveryAddress: orderDTO.deliveryAddress,
    status: orderDTO.status,
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

// assign sources to order items
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
