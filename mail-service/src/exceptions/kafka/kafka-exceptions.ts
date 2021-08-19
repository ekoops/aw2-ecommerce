export class KafkaException {
  constructor(public requestId: string | undefined = undefined, public message: string = "") {}
  static fromJson(requestId: string, message: string) {
    return new KafkaException(message);
  }
}

export class CannotCreateAdminException extends KafkaException {
  constructor(message: string) {
    super(undefined, message);
  }
}
export class CannotCreateTopicException extends KafkaException {
  constructor(message: string) {
    super(undefined, message);
  }
}
export class RetrievingTopicListFailedException extends KafkaException {
  constructor(message: string) {
    super(undefined, message);
  }
}
export class CannotCreateProducerException extends KafkaException {
  constructor(message: string) {
    super(undefined, message);
  }
}
export class CannotCreateConsumerException extends KafkaException {
  constructor(message: string) {
    super(undefined, message);
  }
}

export class CannotProduceException extends KafkaException {
    static fromJson() {
        return new CannotProduceException();
    }
}

export class NoHandlersException extends KafkaException {
  static fromJson() {
    return new NoHandlersException();
  }
}
export class NoValueException extends KafkaException {
  static fromJson(requestId: string) {
    return new NoValueException(requestId);
  }
}
export class ValueParsingFailedException extends KafkaException {
  static fromJson(requestId: string) {
    return new ValueParsingFailedException(requestId);
  }
}

export class ItemsNotAvailableException extends KafkaException {
  static fromJson(requestId: string, message: string) {
    return new ItemsNotAvailableException(requestId, message);
  }
}
export class NotEnoughBudgetException extends KafkaException {
  static fromJson(requestId: string, message: string) {
    return new NotEnoughBudgetException(requestId, message);
  }
}
export class WalletOrderCreationFailedException extends KafkaException {
  static fromJson(requestId: string, message: string) {
    return new WalletOrderCreationFailedException(requestId, message);
  }
}
export class WarehouseOrderCreationFailedException extends KafkaException {
  static fromJson(requestId: string, message: string) {
    return new WarehouseOrderCreationFailedException(requestId, message);
  }
}

export class HandlersBindingFailedException extends KafkaException {
  constructor(message: string) {
    super(undefined, message);
  }
}

