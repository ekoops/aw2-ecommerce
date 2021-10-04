import {Eureka} from "eureka-js-client"
import config from "../config/config";

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
        app: "order-svc",
        instanceId: instanceId, // order-svc-xxxxxxxxxxxxx
        hostName: "order-svc",
        ipAddr: "0.0.0.0",
        healthCheckUrl: "http://localhost:3000/api/v1/status",
        statusPageUrl: "http://localhost:3000/api/v1/status",
        port: {
            "$": instance_port,
            "@enabled": true,
        },
        // Virtual host name by which the clients identifies this service (in this case, it is the eureka service itself)
        vipAddress: "order-svc",
        dataCenterInfo: {
            "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
            name: "MyOwn",
        },
    },
    eureka: {
        host: "discovery-svc",
        port: 8761,
        servicePath: "/eureka/apps/",
        heartbeatInterval: 1000,
        registryFetchInterval: 1000,
        maxRetries: 10
    },
});

// const EurekaClient = new Eureka({
//     instance: {
//         app,
//         instanceId,
//         hostName,
//         ipAddr,
//         healthCheckUrl: "http://localhost:3000/api/v1/status",
//         statusPageUrl,
//         port: {
//             "$": instance_port,
//             "@enabled": true,
//         },
//         vipAddress,
//         dataCenterInfo: {
//             "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
//             name: "MyOwn",
//         },
//     },
//     eureka: {
//         host,
//         port: server_port,
//         servicePath,
//         preferIpAddress: true,
//         heartbeatInterval,
//         registryFetchInterval,
//         // useDns: true
//         maxRetries: 10
//     },
// });

export default EurekaClient;