import {OrderItem, OrderItemDTO} from "../models/OrderItem";
import SourceUtility from "./SourceUtility";

export const toOrderItemDTO = (orderItem: OrderItem): OrderItemDTO => {
    return {
        productId: orderItem.productId,
        amount: orderItem.amount,
        perItemPrice: orderItem.perItemPrice,
        sources: orderItem.sources.map(SourceUtility.toSourceDTO),
    };
};

export const toOrderItem = (orderItemDTO: OrderItemDTO): OrderItem => {
    // TODO: check nullability
    return {
        productId: orderItemDTO.productId,
        amount: orderItemDTO.amount,
        perItemPrice: orderItemDTO.perItemPrice!,
        sources: orderItemDTO.sources!.map(SourceUtility.toSourceDTO),
    };
};

const OrderItemUtility = {
    toOrderItemDTO,
    toOrderItem,
};

export default OrderItemUtility;