package it.polito.ecommerce.catalogservice.converters

import io.r2dbc.spi.Row
import it.polito.ecommerce.catalogservice.domain.Customer
import it.polito.ecommerce.catalogservice.domain.extractUser
import org.springframework.core.convert.converter.Converter

class CustomerReader : Converter<Row, Customer> {
    override fun convert(r: Row): Customer {
        val user = r.extractUser()
        return Customer(
            id = r.get("id").toString().toLong(),
            name = r.get("name").toString(),
            surname = r.get("surname").toString(),
            deliveryAddress = r.get("delivery_address").toString(),
            user = user
        )
    }
}