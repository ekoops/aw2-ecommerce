import config from "../config/config";
import mongoose_ from "mongoose";

const uri = `mongodb://${config.db.host}:${config.db.port}/${config.db.name}`;

const mongoose = await (async (uri: string) => {
    try {
        await mongoose_.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        return await mongoose_.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    } catch (e) {
        // TODO
        throw Error("mongoose instance error");
    }
})(uri);

mongoose.set("runValidators", true);
export default mongoose;