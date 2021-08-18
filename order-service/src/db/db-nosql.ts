import config from "../config/config";
import mongoose, {ConnectOptions} from "mongoose";
import {DbConnectionFailedException} from "../exceptions/db/db-exceptions";

const uri = `mongodb://${config.db.host}:${config.db.port}/${config.db.name}`;

let mongooseOptions: ConnectOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

if (config.environment === "production") {
  mongooseOptions = {
    ...mongooseOptions,
    user: config.db.user,
    pass: config.db.pass,
    authSource: config.db.authSource,
  };
}

// const initDbConnection = async (callback: () => void) => {
const initDbConnection = async () => {
  let retry = 3;
  do {
    try {
      if (config.environment === "development") {
        console.log(`<<<<<<<<< TRYING TO CONNECT TO ${uri} with the following credentials:
      - ${config.db.user}
      - ${config.db.pass}
      - ${config.db.authSource}
 >>>>>>>>>>>>>>`);
      }
      await mongoose.connect(uri, mongooseOptions);
      mongoose.set("runValidators", true);
      mongoose.connection.on("error", (err) => {
        console.log(`HANDLING ERROR AFTER INITIAL CONNECTION: ${err}`);
      });
      mongoose.connection.once("open", () => {
        console.log(`<<<<<<<<< CONNECTED TO ${uri} >>>>>>>>>>>>>>`);
        // callback();
      });
      return mongoose;
    } catch (ex) {
      retry--;
      console.error("MONGODB INITIAL CONNECTION ERROR... TODO);");
      // initial connection fail
    }
  } while (retry);

  throw new DbConnectionFailedException();
};

export default initDbConnection;
