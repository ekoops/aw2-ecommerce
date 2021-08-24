import config from "../config/config";

const env = config.environment;

export default class Logger {
    static dev(namespace: string, message: string) {
        if (env === "development") {
            const str = `[${new Date().toISOString()}] [${namespace}] [DEV] --- ${message} ---`
            console.log(str);
        }
    }
    static log(namespace: string, message: string) {
        const str = `[${new Date().toISOString()}] [${namespace}] [LOG] --- ${message} ---`
        console.log(str)
    }
    static error(namespace: string, message: string) {
        const str = `[${new Date().toISOString()}] [${namespace}] [ERROR] --- ${message} ---`
        console.error(str)
    }

}