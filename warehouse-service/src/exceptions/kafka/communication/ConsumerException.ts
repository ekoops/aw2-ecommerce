import {CommunicationException} from "./CommunicationException";

export class ConsumerException extends CommunicationException {}



/* This exception is throw when a kafka response message body is not present or empty */
export class NoValueException extends ConsumerException {}

/* This exception is throw when a kafka response message body cannot be parsed (either from
 * JSON parser or from the application point of view) */
export class ValueParsingFailedException extends ConsumerException {}

