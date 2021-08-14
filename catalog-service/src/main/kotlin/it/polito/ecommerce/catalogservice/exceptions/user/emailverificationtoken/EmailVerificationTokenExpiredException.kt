package it.polito.ecommerce.catalogservice.exceptions.user.emailverificationtoken

import it.polito.ecommerce.catalogservice.exceptions.BasicApplicationException
import it.polito.ecommerce.catalogservice.exceptions.ErrorType
import java.time.LocalDateTime

class EmailVerificationTokenExpiredException(
    val token: String,
    val expirationDate: LocalDateTime
) : BasicApplicationException(
    type = ErrorType.TOKEN_EXPIRED,
    title = "The provided token is expired",
    detail = "The token($token) expiration date($expirationDate) is gone"
)