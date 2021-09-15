export class KafkaException {
  constructor(public message: string = "") {}
}

export class CannotCreateAdminException extends KafkaException {}
export class CannotCreateTopicException extends KafkaException {}
export class CannotRetrieveTopicListException extends KafkaException {}
export class CannotCreateProducerException extends KafkaException {}
export class CannotCreateConsumerException extends KafkaException {}