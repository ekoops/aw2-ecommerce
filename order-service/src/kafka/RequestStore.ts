import {KafkaException} from "../exceptions/kafka/kafka-exceptions";

// TODO redefine and use the two following types

export interface SuccessPayload {
    key: string;
    value: any;
}
export type FailurePayload = KafkaException

export type SuccessHandler = (successPayload: SuccessPayload) => any
export type FailureHandler = (failurePayload: FailurePayload) => any

export default class RequestStore {
    private static _instance: RequestStore;

    private constructor() {}

    static getInstance() {
        return this._instance || (this._instance = new this());
    }
    private requests: { [key: string]: [SuccessHandler, FailureHandler]; } = {}

    setRequestHandlers(key: string, resolve: SuccessHandler, reject: FailureHandler) {
        this.requests[key] = [resolve, reject];
    }

    getRequestHandlers(key: string): [SuccessHandler, FailureHandler] | undefined {
        return this.requests[key];
    }

    removeRequestHandlers (key: string) {
        delete this.requests[key];
    };
}