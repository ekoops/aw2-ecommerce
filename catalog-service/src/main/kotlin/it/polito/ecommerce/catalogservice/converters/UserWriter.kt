package it.polito.ecommerce.catalogservice.converters

import io.r2dbc.spi.Row
import it.polito.ecommerce.catalogservice.domain.User
import org.springframework.core.convert.converter.Converter
import org.springframework.data.convert.WritingConverter
import org.springframework.data.r2dbc.mapping.OutboundRow

@WritingConverter
class UserWriter: Converter<User, OutboundRow> {
    override fun convert(source: User): OutboundRow? {
        TODO("Not yet implemented")
    }
}