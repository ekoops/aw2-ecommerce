import config from "../config/config";

const env = config.environment;
const instanceId = config.server.instance.id;

export default class Logger {
    private static buildMessage(template: string, ...args: any[]): string | null {
        const underscoreNumber = template.split("_").length - 1;
        if (underscoreNumber !== args.length) return null;
        let message = template;
        for (let i=0; i< args.length; i++) {
            message = message.replace("_", JSON.stringify(args[i]));
        }
        return message;
    }

    static dev(namespace: string, template: string, ...args: any[]) {
        if (env === "development") {
            const message = Logger.buildMessage(template, ...args);
            if (message === null) return;
            const logline = `[${new Date().toISOString()}] [${instanceId}] [${namespace}] [DEV] --- ${message} ---`
            console.log(logline);
        }
    }
    static log(namespace: string, template: string, ...args: any[]) {
        const message = Logger.buildMessage(template, ...args);
        if (message === null) return;
        const logline = `[${new Date().toISOString()}] [${instanceId}] [${namespace}] [LOG] --- ${message} ---`
        console.log(logline)
    }
    static error(namespace: string, template: string, ...args: any[]) {
        const message = Logger.buildMessage(template, ...args);
        if (message === null) return;
        const logline = `[${new Date().toISOString()}] [${instanceId}] [${namespace}] [ERROR] --- ${message} ---`
        console.error(logline)
    }

}