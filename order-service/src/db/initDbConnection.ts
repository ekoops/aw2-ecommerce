import config from "../config/config";
import mongoose, { ConnectOptions } from "mongoose";
import { DbConnectionFailedException } from "../exceptions/db/DbException";
import Logger from "../utils/Logger";

const NAMESPACE = "ORDER-DB";

const initDbConnection = async () => {
  // building uri from config parameters...
  let uri = "mongodb://";

  if (config.db.rsIsEnabled) {
    for (let i = 1; i<=config.db.rsReplFact; i++) {
      uri += `${config.db.host}-${config.db.rsName}-${i}:${config.db.port}/${config.db.name}`
      if (i < config.db.rsReplFact) uri += ",";
    }
  }
  else uri += `${config.db.host}:${config.db.port}/${config.db.name}`;

  // building options...
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
