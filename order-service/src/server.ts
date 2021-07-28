import config from "./config/config";
import initDbConnection from "./db/db-nosql";
import app from "./app";

initDbConnection(() => {
    app.listen(config.server.port, config.server.hostname, () =>
        console.log(
            `Server is listening on ${config.server.hostname}:${config.server.port}`
        )
    );
});
