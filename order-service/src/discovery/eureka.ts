import {Eureka} from "eureka-js-client"
import config from "../config/config";

const {eureka: eureka_config} = config;

const {instance: {
    app,
    instanceId,
    ipAddr,
    port : instancePort,
}, server: {
        host,
        port : serverPort,
        servicePath,
        heartbeatInterval,
        registryFetchInterval
    }
} = eureka_config;

const EurekaClient = new Eureka({
    instance: {
        app: app,
        instanceId: instanceId, // order-svc-xxxxxxxxxxxxx
        hostName: app,
        ipAddr: ipAddr,
        healthCheckUrl: `http://${app}${config.server.api.rootPath}/status`,
        statusPageUrl: `http://${app}${config.server.api.rootPath}/status`,
        port: {
            "$": instancePort,
            "@enabled": true,
        },
        // Virtual host name by which the clients identifies this service (in this case, it is the eureka service itself)
        vipAddress: app,
        dataCenterInfo: {
            "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
            name: "MyOwn",
        },
    },
    eureka: {
        host: host,
        port: serverPort,
        servicePath: servicePath,
        heartbeatInterval: heartbeatInterval,
        registryFetchInterval: registryFetchInterval,
        maxRetries: 10
    },
});

export default EurekaClient;