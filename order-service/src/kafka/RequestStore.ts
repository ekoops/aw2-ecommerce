import {
  CommunicationException,
  TimeoutException,
} from "../exceptions/kafka/communication/CommunicationException";

export interface SuccessPayload {
  key: string;
  value: any;
}
export type FailurePayload = CommunicationException;

export type SuccessHandler = (successPayload: SuccessPayload) => any;
export type FailureHandler = (failurePayload: FailurePayload) => any;
export type TimerId = NodeJS.Timeout;

export default class RequestStore {
  private static _instance: RequestStore;

  private constructor() {}

  static getInstance() {
    return this._instance || (this._instance = new this());
  }
  private requests: {
    [key: string]: [SuccessHandler, FailureHandler, TimerId];
  } = {};

  set = (key: string, resolve: SuccessHandler, reject: FailureHandler) => {
    const timerId = setTimeout(() => {
      delete this.requests[key];
      reject(new TimeoutException(key));
    }, 10000);
    this.requests[key] = [resolve, reject, timerId];
  };

  get = (key: string): [SuccessHandler, FailureHandler] | undefined => {
    console.log('Received response with key', key);
    const handlers = this.requests[key];
    console.log('handlers is ', handlers);
    if (handlers === undefined) return;
    const [resolve, reject, timerId] = handlers;
    clearTimeout(timerId);
    delete this.requests[key];
    return [resolve, reject];
  };

  contains = (key: string): boolean => key in this.requests;

  remove = (key: string) => {
    if (key in this.requests) {
      clearTimeout(this.requests[key][2]);
      delete this.requests[key];
    }
  };
}
