package it.polito.ecommerce.catalogservice

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.cloud.gateway.route.RouteLocator
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder
import org.springframework.context.annotation.Bean

@SpringBootApplication
class CatalogServiceApplication {

}

fun main(args: Array<String>) {
    runApplication<CatalogServiceApplication>(*args)
}
