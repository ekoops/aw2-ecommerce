import initDbConnection from "./db/initDbConnection";
import {OrderModel} from "./models/Order";
import Logger from "./utils/Logger";

const INTERVAL = 30000;
const NAMESPACE = "CLEANER";

const deleteForgottenPendingOrders = async () => {
    const startProcess = Date.now();

    const nextTimerFire = startProcess + INTERVAL;
    const validDateBoundary = new Date(startProcess - INTERVAL);
    try {
        const result = await OrderModel.deleteMany({status: "PENDING", updatedAt: {$lte: validDateBoundary}});
        Logger.dev(NAMESPACE, `deleted forgotten pending orders: ${result.deletedCount}`);
    }
    catch (ex) {
        // @ts-ignore
        Logger.error(NAMESPACE, `failed to delete pending orders: ${ex.toString()}`);
        // TODO: probably nothing to do...
    }

    const endProcess = Date.now();
    setTimeout(deleteForgottenPendingOrders, nextTimerFire - endProcess);
}


const run = async () => {
    await initDbConnection();

    await deleteForgottenPendingOrders();
};

run().catch(() => {});