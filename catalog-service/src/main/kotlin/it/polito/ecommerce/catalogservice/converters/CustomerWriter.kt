package it.polito.ecommerce.catalogservice.converters

import it.polito.ecommerce.catalogservice.domain.Customer
import org.springframework.core.convert.converter.Converter
import org.springframework.data.convert.WritingConverter
import org.springframework.data.r2dbc.mapping.OutboundRow
import org.springframework.r2dbc.core.Parameter

@WritingConverter
class CustomerWriter: Converter<Customer, OutboundRow> {
    override fun convert(c: Customer): OutboundRow {
        if (c.user.id == null || (c.id != null && c.id != c.user.id)) {
            throw Exception("ciao")
        }
        return OutboundRow().apply {
            put("id", Parameter.from(c.user.id))
            put("name", Parameter.from(c.name))
            put("surname", Parameter.from(c.surname))
            put("delivery_address", Parameter.from(c.deliveryAddress))
        }
    }
}