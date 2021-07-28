import {Dialect} from "sequelize";

const hostname = process.env.SERVER_HOSTNAME || "localhost";
const port = process.env.SERVER_PORT || 3000;

const db_name = process.env.DB_NAME || "database";
const db_user = process.env.DB_USER || "user";
const db_pass = process.env.DB_PASS || "pass";
const db_host = process.env.DB_HOST || "localhost";
const db_port = process.env.DB_PORT || 27017;

const NODE_ENV = process.env.NODE_ENV || "unknown";
console.log(`<<<<<<<<<<<<<<<< ${NODE_ENV} >>>>>>>>>>>>>>>>>>>>>>>>>`);

const dialects = ["mysql", "postgres", "sqlite", "mariadb", "mssql"];
let db_dialect: Dialect;
if (process.env.DB_DIALECT && dialects.includes(process.env.DB_DIALECT)) {
  db_dialect = process.env.DB_DIALECT as Dialect;
}
else db_dialect = "mariadb";

const config = {
  server: {
    hostname,
    port: +port,
  },
  db: {
    name: db_name,
    user: db_user,
    pass: db_pass,
    host: db_host,
    dialect: db_dialect,
    port: +db_port,
  },
};

export default config;
