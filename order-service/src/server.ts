import config from "./config/config";
import app from "./app";

app.listen(config.server.port, config.server.hostname, () =>
    console.log(
        `Server is listening on ${config.server.hostname}:${config.server.port}`
    )
);