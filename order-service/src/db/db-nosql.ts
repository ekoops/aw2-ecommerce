import config from "../config/config";
import mongoose, {ConnectOptions} from "mongoose";

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

const initDbConnection = (callback: () => void) => {
  try {
    console.log(`<<<<<<<<< TRYING TO CONNECT TO ${uri} with the following credentials:
      - ${config.db.user}
      - ${config.db.pass}
      - ${config.db.authSource}
 >>>>>>>>>>>>>>`);
    mongoose.connect(uri, mongooseOptions);
    mongoose.set("runValidators", true);
    mongoose.connection.on("error", (err) => {
      console.log(`HANDLING ERROR AFTER INITIAL CONNECTION: ${err}`);
    });
    mongoose.connection.once("open", () => {
      console.log(`<<<<<<<<< CONNECTED TO ${uri} >>>>>>>>>>>>>>`);
      callback();
    });
  } catch (ex) {
    // initial connection fail
    console.log("MONGODB INITIAL CONNECTION ERROR... TODO");
  }
};

export default initDbConnection;
