package it.polito.ecommerce.catalogservice.converters

import it.polito.ecommerce.catalogservice.domain.EmailVerificationToken
import it.polito.ecommerce.catalogservice.exceptions.user.InconsistentUserException
import it.polito.ecommerce.catalogservice.exceptions.user.emailverificationtoken.InconsistentEmailVerificationTokenException
import org.springframework.data.convert.WritingConverter
import org.springframework.core.convert.converter.Converter
import org.springframework.data.r2dbc.mapping.OutboundRow
import org.springframework.r2dbc.core.Parameter

@WritingConverter
class EmailVerificationTokenWriter : Converter<EmailVerificationToken, OutboundRow>{
    override fun convert(evt: EmailVerificationToken): OutboundRow {
        if (evt.user.id == null || (evt.id != null && evt.id != evt.user.id)) {
            evt.user.id ?: throw InconsistentUserException("The user id can not be null")
            throw InconsistentEmailVerificationTokenException ("The emailVerificationTocken id has to be the same as the user one")
        }
        println("DENTRO IL WRITER")
        return OutboundRow().apply {
            put("id", Parameter.from(evt.user.id))
            put("expiration_date", Parameter.from(evt.expirationDate))
            put("token", Parameter.from(evt.token))
        }
    }
}