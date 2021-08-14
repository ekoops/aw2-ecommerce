import {Dialect} from "sequelize";

const hostname = process.env.SERVER_HOSTNAME || "localhost";
const port = process.env.SERVER_PORT || 3000;
const root_path = process.env.SERVER_API_ROOT_PATH || "";

const db_name = process.env.DB_NAME || "database";
const db_user = process.env.DB_USER || "user";
const db_pass = process.env.DB_PASS || "pass";
const db_auth_source = process.env.DB_AUTH_SOURCE || "auth_source"
const db_host = process.env.DB_HOST || "localhost";
const db_port = process.env.DB_PORT || 27017;

const kafka_host = process.env.KAFKA_HOST || "kafka"
const kafka_port = process.env.KAFKA_PORT || 9092

const environment = process.env.NODE_ENV || "unknown";

const dialects = ["mysql", "postgres", "sqlite", "mariadb", "mssql"];
let db_dialect: Dialect;
if (process.env.DB_DIALECT && dialects.includes(process.env.DB_DIALECT)) {
  db_dialect = process.env.DB_DIALECT as Dialect;
}
else db_dialect = "mariadb";

const config = {
  environment: environment,
  server: {
    port: +port,
    api: {
      rootPath: root_path
    }
  },
  db: {
    name: db_name,
    user: db_user,
    pass: db_pass,
    authSource: db_auth_source,
    host: db_host,
    dialect: db_dialect,
    port: +db_port,
  },
  kafka: {
    host: kafka_host,
    port: +kafka_port
  }
};

console.log(JSON.stringify(config, null, " "));

export default config;
