import config from "./config/config";
import initDbConnection from "./db/db-nosql";
import app from "./app";

initDbConnection(() => {
    app.listen(config.server.port, () =>
        console.log(
            `Server is listening on port ${config.server.port}`
        )
    );
});
