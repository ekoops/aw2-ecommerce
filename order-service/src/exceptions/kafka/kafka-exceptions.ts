export class KafkaException {
  constructor(public message: string = "") {}
  static fromJson(transactionId: string, message: string) {
    return new KafkaException(message);
  }
}

export class CannotCreateAdminException extends KafkaException {}
export class CannotCreateTopicException extends KafkaException {}
export class CannotRetrieveTopicListException extends KafkaException {}
export class CannotCreateProducerException extends KafkaException {}
export class CannotCreateConsumerException extends KafkaException {}

export class HandlersBindingFailedException extends KafkaException {}

export class CannotProduceException extends KafkaException {
  constructor(public transactionId: string) {
    super();
  }
  static fromJson(transactionId: string) {
    return new CannotProduceException(transactionId);
  }
}
