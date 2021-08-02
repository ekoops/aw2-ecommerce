import config from "../config/config";
import mongoose from "mongoose";

const uri = `mongodb://${config.db.host}:${config.db.port}/${config.db.name}`;

const initDbConnection = (callback: () => void) => {
  try {
    mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    mongoose.set("runValidators", true);
    mongoose.connection.on("error", err => {
      console.log(`HANDLING ERROR AFTER INITIAL CONNECTION: ${err}`);
    });
    mongoose.connection.once("open", callback);
  }
  catch (ex) {
    // initial connection fail
    console.log("MONGODB INITIAL CONNECTION ERROR... TODO");
  }
};



export default initDbConnection;
