package it.polito.ecommerce.catalogservice.converters

import io.r2dbc.spi.Row
import it.polito.ecommerce.catalogservice.domain.User
import org.springframework.core.convert.converter.Converter
import org.springframework.data.convert.WritingConverter
import org.springframework.data.r2dbc.mapping.OutboundRow
import org.springframework.r2dbc.core.Parameter

@WritingConverter
class UserWriter: Converter<User, OutboundRow> {
    override fun convert(u: User)=
        OutboundRow().apply {
            if (u.id!=null) put("id", Parameter.from(u.id))
            put("username", Parameter.from(u.username))
            put("email", Parameter.from(u.email))
            put("password", Parameter.from(u.password))
            put("is_enabled", Parameter.from(u.isEnabled))
            put("is_locked", Parameter.from(u.isLocked))
            put("roles", Parameter.from(u.roles))
            put("name", Parameter.from(u.name))
            put("surname", Parameter.from(u.surname))
            if (u.deliveryAddress != null) put("delivery_address", Parameter.from(u.deliveryAddress))
        }
}