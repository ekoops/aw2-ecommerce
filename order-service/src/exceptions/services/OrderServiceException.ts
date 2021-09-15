export class OrderServiceException {}


export class OrderNotExistException extends OrderServiceException {}
export class OrderAlreadyCancelledException extends OrderServiceException {}

export class OrderHandlingFailedException extends OrderServiceException {}