import config from "../config/config";

const env = config.environment;
const instanceId = config.server.instance.id;

export default class Logger {
    static dev(namespace: string, message: string) {
        if (env === "development") {
            const str = `[${new Date().toISOString()}] [${instanceId}] [${namespace}] [DEV] --- ${message} ---`
            console.log(str);
        }
    }
    static log(namespace: string, message: string) {
        const str = `[${new Date().toISOString()}] [${instanceId}] [${namespace}] [LOG] --- ${message} ---`
        console.log(str)
    }
    static error(namespace: string, message: string) {
        const str = `[${new Date().toISOString()}] [${instanceId}] [${namespace}] [ERROR] --- ${message} ---`
        console.error(str)
    }

}