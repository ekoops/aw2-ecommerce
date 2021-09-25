import {CommunicationException} from "../CommunicationException";

export class ApplicationException extends CommunicationException {
  public constructor(transactionId: string, message: string) {
    super(transactionId, message);
  }
}

export class ItemsNotAvailableException extends ApplicationException {
  static fromJson(transactionId: string, message: string) {
    return new ItemsNotAvailableException(transactionId, message);
  }
}
export class NotEnoughBudgetException extends ApplicationException {
  static fromJson(transactionId: string, message: string) {
    return new NotEnoughBudgetException(transactionId, message);
  }
}
export class WalletOrderCreationFailedException extends ApplicationException {
  static fromJson(transactionId: string, message: string) {
    return new WalletOrderCreationFailedException(transactionId, message);
  }
}
export class WarehouseOrderCreationFailedException extends ApplicationException {
  static fromJson(transactionId: string, message: string) {
    return new WarehouseOrderCreationFailedException(transactionId, message);
  }
}