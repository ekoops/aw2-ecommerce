import {Eureka} from "eureka-js-client"
import config from "../config/config"

const {eureka: eureka_config} = config;

const {instance: {
    app,
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
        hostName,
        ipAddr,
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
        registryFetchInterval
    },
});

export default EurekaClient;