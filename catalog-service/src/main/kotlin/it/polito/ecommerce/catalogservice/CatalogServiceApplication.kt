package it.polito.ecommerce.catalogservice

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.cloud.netflix.eureka.EnableEurekaClient

@SpringBootApplication
@EnableEurekaClient
class CatalogServiceApplication

fun main(args: Array<String>) {
    runApplication<CatalogServiceApplication>(*args)
}
