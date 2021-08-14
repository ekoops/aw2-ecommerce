package it.polito.ecommerce.catalogservice.converters

import it.polito.ecommerce.catalogservice.domain.EmailVerificationToken
import org.springframework.data.convert.WritingConverter
import org.springframework.core.convert.converter.Converter
import org.springframework.data.r2dbc.mapping.OutboundRow
import org.springframework.r2dbc.core.Parameter

@WritingConverter
class EmailVerificationTokenWriter : Converter<EmailVerificationToken, OutboundRow>{
    override fun convert(evt: EmailVerificationToken): OutboundRow {
        if (evt.user.id == null || evt.id != evt.user.id) {
            throw Exception("ciao")
        }
        return OutboundRow().apply {
            put("id", Parameter.from(evt.user.id))
            put("expiration_date", Parameter.from(evt.expirationDate))
            put("token", Parameter.from(evt.token))
        }
    }
}