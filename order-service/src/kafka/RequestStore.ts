import {CannotProduceException} from "../exceptions/kafka/kafka-exceptions";
import {CommunicationException} from "../exceptions/communication-exceptions";
import {ApplicationException} from "../exceptions/application-exceptions";

// TODO redefine and use the two following types

export interface SuccessPayload {
    key: string;
    value: any;
}
export type FailurePayload = CannotProduceException | CommunicationException | ApplicationException

export type SuccessHandler = (successPayload: SuccessPayload) => any
export type FailureHandler = (failurePayload: FailurePayload) => any

export default class RequestStore {
    private static _instance: RequestStore;

    private constructor() {}

    static getInstance() {
        return this._instance || (this._instance = new this());
    }
    private requests: { [key: string]: [SuccessHandler, FailureHandler]; } = {}

    set(key: string, resolve: SuccessHandler, reject: FailureHandler) {
        this.requests[key] = [resolve, reject];
    }

    get(key: string): [SuccessHandler, FailureHandler] | undefined {
        return this.requests[key];
    }

    remove (key: string) {
        delete this.requests[key];
    };
}