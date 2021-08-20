import {Eureka} from "eureka-js-client"
import config from "../config/config"
import {promisify} from "util";

const {eureka: eureka_config} = config;

const {instance: {
    app,
    instanceId,
    hostName,
    ipAddr,
    statusPageUrl,
    port : instance_port,
    vipAddress
}, server: {
        host,
        port : server_port,
        servicePath,
        heartbeatInterval,
        registryFetchInterval
    }
} = eureka_config;

const EurekaClient = new Eureka({
    instance: {
        app,
        instanceId,
        hostName,
        ipAddr,
        healthCheckUrl: "http://order-svc:3000/api/v1/status",
        statusPageUrl,
        port: {
            "$": instance_port,
            "@enabled": true,
        },
        vipAddress,
        dataCenterInfo: {
            "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
            name: "MyOwn",
        },
    },
    eureka: {
        host,
        port: server_port,
        servicePath,
        preferIpAddress: true,
        heartbeatInterval,
        registryFetchInterval,
        // useDns: true
    },
});


const initEurekaClient = promisify(EurekaClient.start);

export default EurekaClient;