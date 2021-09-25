import {CommunicationException} from "./CommunicationException";

export class ProducerException extends CommunicationException {}



/* This exception is throw when the message cannot be produced on kafka */
export class CannotProduceException extends ProducerException {}
