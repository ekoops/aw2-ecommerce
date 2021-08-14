import {v4 as uuidv4} from "uuid";
import RequestStore from "./RequestStore";

export const generateUUID = (requestStore: RequestStore): string => {
    let uuid: string;
    do {
        uuid = uuidv4();
    } while (requestStore.getRequestHandlers(uuid));
    return uuid;
}
