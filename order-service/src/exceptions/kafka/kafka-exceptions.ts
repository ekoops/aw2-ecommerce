export class KafkaException {
    constructor(public message: string = "") {}
}

export class CannotProduceException extends KafkaException {}
export class ItemsNotAvailableException extends KafkaException {}
export class NoValueException extends KafkaException {}
export class ValueParsingFailedException extends KafkaException {}
export class NotEnoughBudgetException extends KafkaException {}

export class WalletOrderCreationFailureException extends KafkaException {}
export class WarehouseOrderCreationFailureException extends KafkaException {}