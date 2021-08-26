export class ApplicationException {
  constructor(
    public transactionId: string,
    public message: string = ""
  ) {}
}

export class NoHandlersException extends ApplicationException {}

export class OctHandlingFailedException extends ApplicationException {}
export class NoOctException extends ApplicationException {}

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
