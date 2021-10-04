import { v4 as uuidv4 } from "uuid";
import RequestStore from "../kafka/RequestStore";

const requestStore = RequestStore.getInstance();

export const generateUUID = (isUuidForRequest: boolean = true): string => {
  if (!isUuidForRequest) return uuidv4();
  let uuid: string;
  do {
    uuid = uuidv4();
  } while (requestStore.contains(uuid));
  return uuid;
};


export const retry = async (attempts: number, interval: number, f: Function, ...args: any[]) => {
  try {
    return await f(...args);
  }
  catch (ex) {
    if (attempts !== Infinity) {
      attempts--;
      if (attempts === 0) throw ex;
    }
    setTimeout(retry.bind(null, attempts, interval, f, ...args), interval);
  }
};

export const force = retry.bind(null, Infinity, 1000);