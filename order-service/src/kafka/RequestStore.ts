import {v4 as uuidv4} from "uuid";

export default class RequestStore {
    private requests: { [key: string]: [Function, Function]; } = {}

    setRequestHandlers(key: string, resolve: Function, reject: Function) {
        this.requests[key] = [resolve, reject];
    }

    getRequestHandlers(key: string): [Function, Function] | undefined {
        return this.requests[key];
    }

    removePromiseHandlers (key: string) {
        delete this.requests[key];
    };
}