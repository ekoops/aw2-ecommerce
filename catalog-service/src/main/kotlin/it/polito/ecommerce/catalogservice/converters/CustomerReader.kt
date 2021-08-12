package it.polito.ecommerce.catalogservice.converters

import io.r2dbc.spi.Row
import it.polito.ecommerce.catalogservice.domain.Customer
import it.polito.ecommerce.catalogservice.domain.User
import org.springframework.core.convert.converter.Converter

class CustomerReader : Converter<Row, Customer> {
    override fun convert(r: Row) =
        Customer(
            r.get("id") as Long,
            r.get("name") as String,
            r.get("surname") as String,
            r.get("deliveryAddress") as String,
            r.get("user") as User
        )
}