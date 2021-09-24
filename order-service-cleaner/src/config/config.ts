import { v4 as uuidv4 } from "uuid";

const environment = process.env.NODE_ENV || "development";

const server_instance_id =
  process.env.SERVER_INSTANCE_ID || `ORDER-SVC-CLEANER-${uuidv4()}`;
// const server_port = process.env.SERVER_PORT || 3000;
// const server_api_root_path = process.env.SERVER_API_ROOT_PATH || "";

const db_name = process.env.DB_NAME || "database";
const db_user = process.env.DB_USER || "user";
const db_pass = process.env.DB_PASS || "pass";
const db_auth_source = process.env.DB_AUTH_SOURCE || "auth_source";
const db_host = process.env.DB_HOST || "localhost";
const db_port = process.env.DB_PORT || 27017;
const db_rs_enabled = process.env.DB_RS_ENABLED || false;
const db_rs_name = process.env.DB_RS_NAME || "";
const db_rs_repl_fact = process.env.DB_RS_REPL_FACT || 0;

const config = {
  environment: environment,
  server: {
    instance: { id: server_instance_id },
    // port: +server_port,
    // api: {
    //   rootPath: server_api_root_path,
    // },
  },
  db: {
    name: db_name,
    user: db_user,
    pass: db_pass,
    authSource: db_auth_source,
    host: db_host,
    port: +db_port,
    rsIsEnabled: !!db_rs_enabled,
    rsName: db_rs_name,
    rsReplFact: +db_rs_repl_fact,
  },
};

console.log(JSON.stringify(config, null, " "));

export default config;
