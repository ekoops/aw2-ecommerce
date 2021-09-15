import config from "../config/config";
import mongoose, { ConnectOptions } from "mongoose";
import { DbConnectionFailedException } from "../exceptions/db/DbException";
import Logger from "../utils/Logger";

const NAMESPACE = "ORDER-DB";

const uri = `mongodb://${config.db.host}:${config.db.port}/${config.db.name}`;

let mongooseOptions: ConnectOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// if (config.environment === "production") {
  mongooseOptions = {
    ...mongooseOptions,
    user: config.db.user,
    pass: config.db.pass,
    authSource: config.db.authSource,
  };
// }

const initDbConnection = async () => {
  const credentials = `${config.db.authSource}:${config.db.user}:${config.db.pass}`;
  const message = `trying to connect to ${uri} with credentials: ${credentials}`;
  Logger.dev(NAMESPACE, message);
  try {
    await mongoose.connect(uri, mongooseOptions);
    Logger.dev(NAMESPACE, "connected successfully to db")

    mongoose.set("runValidators", true);
    // handling error after initial connection
    mongoose.connection.on("error", (err) =>
      Logger.error(NAMESPACE, `connection to db lost: ${err}`)
    );
  } catch (ex) {
    // handling initial connection fail
    Logger.error(NAMESPACE, `failed to initiate the connection: ${ex.message}`);
    throw new DbConnectionFailedException();
  }
};

export default initDbConnection;
