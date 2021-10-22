import {CommunicationException} from "../CommunicationException";

export class ApplicationException extends CommunicationException {
  public constructor(transactionId: string, message: string) {
    super(transactionId, message);
  }
}

export class ItemsNotAvailableException extends ApplicationException {
  static fromJson(transactionId: string) {
    return new ItemsNotAvailableException(transactionId, "the requested items quantity is not available");
  }
}
export class NotEnoughBudgetException extends ApplicationException {
  static fromJson(transactionId: string) {
    return new NotEnoughBudgetException(transactionId, "you don't have enough money");
  }
}
export class WalletOrderCreationFailedException extends ApplicationException {
  static fromJson(transactionId: string) {
    return new WalletOrderCreationFailedException(transactionId, "wallet cannot remove money");
  }
}
export class WarehouseOrderCreationFailedException extends ApplicationException {
  static fromJson(transactionId: string) {
    return new WarehouseOrderCreationFailedException(transactionId, "warehouse cannot remove items");
  }
}