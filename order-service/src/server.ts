import config from "./config/config";
import initDbConnection from "./db/db-nosql";
import {getKafkaInstance} from "./kafka/kafka";
import getApp from "./app";

const { host, port } = config.kafka;
const broker = `${host}:${port}`;

getKafkaInstance("clientId", [broker]);

initDbConnection().then(async () => {
  try {
    const {rootPath} = config.server.api;
    const app = await getApp(rootPath);
    app.listen(config.server.port, () =>
        console.log(`Server is listening on port ${config.server.port}`)
    );
  }
  catch (ex) {
    process.exit(-2);
  }
}).catch((ex) => {
  console.error(ex);
  process.exit(-1);
});