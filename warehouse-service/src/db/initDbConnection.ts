import config from "../config/config";
import mongoose, { ConnectOptions } from "mongoose";
import Logger from "../utils/Logger";
import {DbConnectionFailedException} from "../exceptions/db/DbException";


const NAMESPACE = "WAREHOUSE-DB";

const initDbConnection = async () => {
  // building uri from config parameters...
  let uri = "mongodb://";

  if (config.db.rsIsEnabled) {
    for (let i = 1; i <= config.db.rsReplFact; i++) {
      uri += `${config.db.host}-${config.db.rsName}-${i}:${config.db.port}`;
      if (i < config.db.rsReplFact) uri += ",";
    }
    uri += `/${config.db.name}`;
  } else uri += `${config.db.host}:${config.db.port}/${config.db.name}`;

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
  Logger.dev(
    NAMESPACE,
    "trying to connect to %v with credentials: %v",
    uri,
    credentials
  );
  for (let i=0; i<5; i++) {
    try {
      Logger.dev(NAMESPACE, "connecting to db, attempt "+i);

      await mongoose.connect(uri, mongooseOptions);
      Logger.dev(NAMESPACE, "connected successfully to db");

      mongoose.set("runValidators", true);
      // handling error after initial connection
      mongoose.connection.on("error", (err) =>
        Logger.error(NAMESPACE, "connection to db lost: %v", err)
      );
      break;
    } catch (ex: any) {
      // handling initial connection fail
      // @ts-ignore
      Logger.error(
        NAMESPACE,
        "failed to initiate the connection: %v",
        ex.message
      );
      throw new DbConnectionFailedException();
    }

  }
};

export default initDbConnection;
