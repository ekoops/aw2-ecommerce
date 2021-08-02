package it.polito.ecommerce.catalogservice.converters

import io.r2dbc.spi.Row
import it.polito.ecommerce.catalogservice.domain.Rolename
import it.polito.ecommerce.catalogservice.domain.User
import org.springframework.core.convert.converter.Converter

class UserReader : Converter<Row, User> {
    override fun convert(r:Row) =
        User(
            r.get("id") as Long,
            r.get("username") as String,
            r.get("email") as String,
            r.get("password") as String,
            r.get("isEnabled") as Boolean,
            r.get("isLocked") as Boolean,
            r.get("role") as Rolename
        )
}