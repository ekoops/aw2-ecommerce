import {generateUUID} from "../kafka/utils";

const environment = process.env.NODE_ENV || "unknown";

const server_instance_id = process.env.SERVER_INSTANCE_ID || `order-svc-${generateUUID(false)}`;
const server_port = process.env.SERVER_PORT || 3000;
const server_api_root_path = process.env.SERVER_API_ROOT_PATH || "";

const db_name = process.env.DB_NAME || "database";
const db_user = process.env.DB_USER || "user";
const db_pass = process.env.DB_PASS || "pass";
const db_auth_source = process.env.DB_AUTH_SOURCE || "auth_source";
const db_host = process.env.DB_HOST || "localhost";
const db_port = process.env.DB_PORT || 27017;

const kafka_host = process.env.KAFKA_HOST || "kafka";
const kafka_port = process.env.KAFKA_PORT || 9092;
const kafka_client_id = process.env.KAFKA_CLIENT_ID || server_instance_id;

const eureka_instance_app = process.env.EUREKA_INSTANCE_APP || "order-svc";
const eureka_instance_id = process.env.EUREKA_INSTANCE_ID || server_instance_id;
const eureka_instance_hostName = process.env.EUREKA_INSTANCE_HOST_NAME || "localhost";
const eureka_instance_ipAddr = process.env.EUREKA_INSTANCE_IP_ADDR || "127.0.0.1";
const eureka_instance_statusPageUrl = process.env.EUREKA_INSTANCE_STATUS_PAGE_URL || "http://localhost:3000/info";
const eureka_instance_port = process.env.EUREKA_INSTANCE_PORT || 3000;
const eureka_instance_vipAddress = process.env.EUREKA_INSTANCE_VIP_ADDRESS || "order-svc";

const eureka_server_host = process.env.EUREKA_SERVER_HOST || "localhost";
const eureka_server_port = process.env.EUREKA_SERVER_PORT || 8761;
const eureka_server_servicePath = process.env.EUREKA_SERVER_SERVICE_PATH || "/eureka/apps/";
const eureka_server_heartbeatInterval = process.env.EUREKA_SERVER_HEART_BEAT_INTERVAL || 5000;
const eureka_server_registryFetchInterval = process.env.EUREKA_SERVER_REGISTRY_FETCH_INTERVAL || 5000;

const config = {
  environment: environment,
  server: {
    instance: {id: server_instance_id},
    port: +server_port,
    api: {
      rootPath: server_api_root_path,
    },
  },
  db: {
    name: db_name,
    user: db_user,
    pass: db_pass,
    authSource: db_auth_source,
    host: db_host,
    port: +db_port,
  },
  kafka: {
    host: kafka_host,
    port: +kafka_port,
    clientId: kafka_client_id
  },
  eureka: {
    instance: {
      app: eureka_instance_app,
      instanceId: eureka_instance_id,
      hostName: eureka_instance_hostName,
      ipAddr: eureka_instance_ipAddr,
      statusPageUrl: eureka_instance_statusPageUrl,
      port: +eureka_instance_port,
      vipAddress: eureka_instance_vipAddress,
    },
    server: {
      host: eureka_server_host,
      port: +eureka_server_port,
      servicePath: eureka_server_servicePath,
      heartbeatInterval: +eureka_server_heartbeatInterval,
      registryFetchInterval: +eureka_server_registryFetchInterval,
    },
  },
};

console.log(JSON.stringify(config, null, " "));

export default config;
