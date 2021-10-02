export class OrderServiceException {}


export class OrderNotFoundException extends OrderServiceException {}
export class OrderAlreadyCancelledException extends OrderServiceException {}

export class OrderHandlingFailedException extends OrderServiceException {}