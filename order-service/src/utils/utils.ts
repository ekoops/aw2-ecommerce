import { v4 as uuidv4 } from "uuid";
import RequestStore from "../kafka/RequestStore";

const requestStore = RequestStore.getInstance();

export const generateUUID = (isUuidForRequest: boolean = true): string => {
  if (!isUuidForRequest) return uuidv4();
  let uuid: string;
  do {
    uuid = uuidv4();
  } while (requestStore.get(uuid));
  return uuid;
};

export const retry = async (
  retry: number,
  callback: (...args: any) => Promise<any>
): Promise<any> => {
  while (retry) {
    try {
      return callback();
    } catch (ex) {
      retry--;
      if (retry === 0) throw ex;
    }
  }
};
