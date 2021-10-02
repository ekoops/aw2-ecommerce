import {OrderStatus, OrderStatusName} from "../domain/OrderStatus";

const toOrderStatus = (key: string): OrderStatus | undefined => {
    if (!isNaN(Number(key))) return undefined;
    return OrderStatus[key as keyof typeof OrderStatus];
}
const toOrderStatusName = (orderStatus: OrderStatus): OrderStatusName => {
    return OrderStatus[orderStatus] as OrderStatusName;
}

const OrderItemUtility = {
    toOrderStatus,
    toOrderStatusName
};

export default OrderItemUtility;