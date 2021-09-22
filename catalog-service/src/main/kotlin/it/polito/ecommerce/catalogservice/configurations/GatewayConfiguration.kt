package it.polito.ecommerce.catalogservice.configurations

import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig
import io.github.resilience4j.timelimiter.TimeLimiterConfig
import org.springframework.cloud.circuitbreaker.resilience4j.ReactiveResilience4JCircuitBreakerFactory
import org.springframework.cloud.circuitbreaker.resilience4j.Resilience4JConfigBuilder
import org.springframework.cloud.client.circuitbreaker.Customizer
import org.springframework.cloud.gateway.route.RouteLocator
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.time.Duration


@Configuration
class GatewayConfiguration {

    @Bean
    fun routes(builder: RouteLocatorBuilder): RouteLocator {
        return builder.routes()
            .route("orders") { it -> it
                //match incoming path
                .path("/api/v1/orders/**")
                .filters{ f ->
                    //manipulate outgoing path
                    f.circuitBreaker{
                        //handle failure
                        it.setFallbackUri("forward:/api/v1/failureOrder")
                    }
                }
                //switch endpoint to a load balanced one
                .uri("lb://order-svc")
            }
            .route("wallets") { it -> it
                //match incoming path
                .path("/api/v1/wallets/**")
                .filters{ f ->
                    //manipulate outgoing path
                    f.circuitBreaker{
                        //handle failure
                        it.setFallbackUri("forward:/api/v1/failureWallet")
                    }
                }
                //switch endpoint to a load balanced one
                .uri("lb://wallet-svc")
            }
            .route("warehouses") { it -> it
                //match incoming path
                .path("/api/v1/warehouses/**")
                .filters{ f ->
                    //manipulate outgoing path
                    f.addRequestHeader("accept", "application/octet-stream")
                    f.addResponseHeader("Content-Type", "application/octet-stream")
                    f.circuitBreaker{
                        //handle failure
                        it.setFallbackUri("forward:/api/v1/failureWarehouse")
                    }
                }
                //switch endpoint to a load balanced one
                .uri("lb://warehouse-svc")
            }
            .route("products") { it -> it
                //match incoming path
                .path("/api/v1/products/**")
                .filters{f ->
                    //manipulate outgoing path
                    f.circuitBreaker{
                        //handle failure
                        it.setFallbackUri("forward:/api/v1/failureWarehouse")
                    }
                }
                //switch endpoint to a load balanced one
                .uri("lb://warehouse-svc")
            }
            .build()
    }


    //handle service unavailability - circuit breaker definition
    @Bean
    fun defaultCustomizer(): Customizer<ReactiveResilience4JCircuitBreakerFactory> {
        return Customizer {
                factory -> factory.configureDefault {
                id -> Resilience4JConfigBuilder(id)
            .circuitBreakerConfig(CircuitBreakerConfig.ofDefaults())
            .timeLimiterConfig(
                TimeLimiterConfig
                            .custom()
                            .timeoutDuration(
                                //if after 22 seconds the application does not respond, it brakes
                                Duration.ofSeconds(22)
                            ).build()
            )
            .build()
        }
        }
    }

//    //handle service unavailability - circuit breaker definition
//    @Bean
//    fun defaultCustomizer(): org.springframework.cloud.client.circuitbreaker.Customizer<ReactiveResilience4JCircuitBreakerFactory> {
//        return org.springframework.cloud.client.circuitbreaker.Customizer {
//                factory -> factory.configureDefault {
//                id -> Resilience4JConfigBuilder(id)
//            .circuitBreakerConfig(CircuitBreakerConfig.ofDefaults())
//            .timeLimiterConfig(TimeLimiterConfig.custom().timeoutDuration(Duration.ofSeconds(22)).build()) //requests that takes more than 15 seconds will open the circuit
//            .build()
//        }
//        }
//    }
}