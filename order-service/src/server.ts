import config from "./config/config";


import app from "./app";
import https from "https";
import * as fs from "fs";

// TODO
const httpsOptions = {
  key: fs.readFileSync("test/fixtures/keys/agent2-key.pem"),
  cert: fs.readFileSync("test/fixtures/keys/agent2-cert.cert"),
};

https
  .createServer(httpsOptions, app)
  .listen(config.server.port, config.server.hostname, () =>
    console.log(
      `Server is listening on ${config.server.hostname}:${config.server.port}`
    )
  );
