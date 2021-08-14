package it.polito.ecommerce.catalogservice.converters

import io.r2dbc.spi.Row
import it.polito.ecommerce.catalogservice.domain.EmailVerificationToken
import it.polito.ecommerce.catalogservice.domain.extractUser
import org.springframework.core.convert.converter.Converter
import org.springframework.data.convert.ReadingConverter
import java.time.LocalDateTime

@ReadingConverter
class EmailVerificationTokenReader : Converter<Row, EmailVerificationToken> {
    override fun convert(r: Row): EmailVerificationToken {
        val user = r.extractUser()
        return EmailVerificationToken(
            id = r.get("id").toString().toLong(),
            expirationDate = LocalDateTime.parse(r.get("expiration_date").toString()),
            token = r.get("token").toString(),
            user = user
        )
    }
}