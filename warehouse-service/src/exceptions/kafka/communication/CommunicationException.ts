import {KafkaException} from "../KafkaException";

export class CommunicationException extends KafkaException {
    constructor(public transactionId: string, message: string = "") {
        super(message);
    }
}


/* This exception is throw when no response comes before a certain period */
export class TimeoutException extends CommunicationException {}
