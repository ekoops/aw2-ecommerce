package it.polito.ecommerce.catalogservice.converters

import io.r2dbc.spi.Row
import it.polito.ecommerce.catalogservice.domain.User
import it.polito.ecommerce.catalogservice.domain.extractUser
import org.springframework.core.convert.converter.Converter
import org.springframework.data.convert.ReadingConverter

@ReadingConverter
class UserReader : Converter<Row, User> {
    override fun convert(r: Row) = r.extractUser()
}