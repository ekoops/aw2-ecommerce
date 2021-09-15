import {v4 as uuidv4} from "uuid";

const abortFn = (envVar: string) => {
  throw new Error(`The ${envVar} environment variable is required`);
};

const environment = process.env.NODE_ENV || "unknown";

const server_instance_id = process.env.SERVER_INSTANCE_ID || `MAIL-SVC-${uuidv4()}`;
const server_port = process.env.SERVER_PORT || 3000;
const server_api_root_path = process.env.SERVER_API_ROOT_PATH || "";

const kafka_host = process.env.KAFKA_HOST || "kafka";
const kafka_port = process.env.KAFKA_PORT || 9092;
const kafka_client_id = process.env.KAFKA_CLIENT_ID || server_instance_id;


const user = process.env.OAUTH2_USER || abortFn("OAUTH2_USER");
const clientId = process.env.OAUTH2_CLIENT_ID || abortFn("OAUTH2_CLIENT_ID");
const clientSecret =
  process.env.OAUTH2_CLIENT_SECRET || abortFn("OAUTH2_CLIENT_SECRET");
const redirectUri =
  process.env.OAUTH2_REDIRECT_URI || abortFn("OAUTH2_REDIRECT_URI");
const refreshToken =
  process.env.OAUTH2_REFRESH_TOKEN || abortFn("OAUTH2_REFRESH_TOKEN");

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
  environment,
  server: {
    instance: {id: server_instance_id},
    port: +server_port,
    api: {
      rootPath: server_api_root_path,
    },
  },
  oauth2: {
    user,
    clientId,
    clientSecret,
    redirectUri,
    refreshToken,
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

export default config;
