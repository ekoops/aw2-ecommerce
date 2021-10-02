export class OrderRepositoryException {}

export class OrdersRetrievingFailedException extends OrderRepositoryException {}
export class OrderCreationFailedException extends OrderRepositoryException {}
export class OrderSavingFailedException extends OrderRepositoryException {}
export class OrderDeletionFailedException extends OrderRepositoryException {}
export class OrderStatusChangingFailedException extends OrderRepositoryException {}