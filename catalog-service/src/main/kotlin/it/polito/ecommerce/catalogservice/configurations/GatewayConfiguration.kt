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

    //TODO: capire perchè questo non funziona e quello di sotto si
//    @Bean
//    fun myRoutes(routeLocatorBuilder: RouteLocatorBuilder): RouteLocator? {
//        return routeLocatorBuilder.routes()
//            .route("retiveOrders") { p -> p
//                    .path("/orders/**")
//                .filters{f->
//                    f.rewritePath("", "")
//                    f.circuitBreaker{it-> it.setFallbackUri("forward:defaultFallback/")}
//                }
//                    .uri("lb://order-svc")
//            }
//            .route { p -> p
//                    .path("/v1/country/coastline")
//                    .uri("http://localhost:8081")
//            }
//            .build()
//    }


    @Bean
    fun routes(builder: RouteLocatorBuilder): RouteLocator {
        return builder.routes()
            .route("orders") { it -> it
                //match incoming path
                .path("/api/v1/orders/**")
                .filters{f ->
                    //manipulate outgoing path
                    f.circuitBreaker{
                        //handle failure
                        it.setFallbackUri("forward:/api/v1/defaultFallback/")
                    }
                }
                //switch endpoint to a load balanced one
                .uri("lb://order-svc")
            }
            .route("wallets") { it -> it
                //match incoming path
                .path("/api/v1/wallets/**")
                .filters{f ->
                    //manipulate outgoing path
                    f.circuitBreaker{
                        //handle failure
                        it.setFallbackUri("forward:/api/v1/defaultFallback/")
                    }
                }
                //switch endpoint to a load balanced one
                .uri("lb://wallet-svc")
            }
            .route("warehouses") { it -> it
                //match incoming path
                .path("/api/v1/warehouses/**")
                .filters{f ->
                    //manipulate outgoing path
                    f.circuitBreaker{
                        //handle failure
                        it.setFallbackUri("forward:/api/v1/defaultFallback/")
                    }
                }
                //switch endpoint to a load balanced one
                .uri("lb://warehouses-svc")
            }
            .route("products") { it -> it
                //match incoming path
                .path("/api/v1/pruducts/**")
                .filters{f ->
                    //manipulate outgoing path
                    f.circuitBreaker{
                        //handle failure
                        it.setFallbackUri("forward:/api/v1/defaultFallback/")
                    }
                }
                //switch endpoint to a load balanced one
                .uri("lb://warehouses-svc")
            }
            .build()
    }

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
                                //if after 4 seconds the application brakes
                                Duration.ofSeconds(4)
                            ).build()
            )
            .build()
        }
        }
    }
}