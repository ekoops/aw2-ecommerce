package it.polito.ecommerce.catalogservice

import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig
import io.github.resilience4j.timelimiter.TimeLimiterConfig
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.cloud.circuitbreaker.resilience4j.ReactiveResilience4JCircuitBreakerFactory
import org.springframework.cloud.circuitbreaker.resilience4j.Resilience4JConfigBuilder
import org.springframework.cloud.client.circuitbreaker.Customizer
import org.springframework.cloud.gateway.route.RouteLocator
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder
import org.springframework.cloud.netflix.eureka.EnableEurekaClient
import org.springframework.context.annotation.Bean

@SpringBootApplication
@EnableEurekaClient
class CatalogServiceApplication {

    @Bean
    fun routes(builder: RouteLocatorBuilder): RouteLocator {
        return builder
            .routes()
            .route("catalog") {
                    it -> it
                //match incoming path
                .path("/catalog/**")
                .filters{
                        //manipulate outgoing path
                        f ->
                    f.circuitBreaker{
                        //TODO: capire come fare lo stesso nelle properties ed implementare l'endpoint
                        //handle failure
                        it-> it.setFallbackUri("forward:failure/")
                    }
                    f.rewritePath("/catalog","")
                }
                //switch endpoint to a load balanced one
                .uri("lb://catalog")
            }
            .build()
    }


    @Bean
    fun defaultCustomizer(): Customizer<ReactiveResilience4JCircuitBreakerFactory> {
        return Customizer {
                factory -> factory.configureDefault {
                id -> Resilience4JConfigBuilder(id)
                    .circuitBreakerConfig(CircuitBreakerConfig.ofDefaults())
                    .timeLimiterConfig(TimeLimiterConfig.ofDefaults()
//                            .custom()
//                            .timeoutDuration(
//                                Duration.ofSeconds(4)
//                            ).build()
                    )
                    .build()
            }
        }
    }
}

fun main(args: Array<String>) {
    runApplication<CatalogServiceApplication>(*args)
}
