export class CommunicationException {
    constructor(public transactionId: string) {}
}

export class NoValueException extends CommunicationException {
    static fromJson(transactionId: string) {
        return new NoValueException(transactionId);
    }
}
export class ValueParsingFailedException extends CommunicationException {
    static fromJson(transactionId: string) {
        return new ValueParsingFailedException(transactionId);
    }
}
export class ValueFormatNotValidException extends CommunicationException {
    static fromJson(transactionId: string) {
        return new ValueFormatNotValidException(transactionId);
    }
}