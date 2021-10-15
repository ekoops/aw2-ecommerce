package it.polito.ecommerce.catalogservice.exceptions.security

import it.polito.ecommerce.catalogservice.exceptions.BasicApplicationException
import it.polito.ecommerce.catalogservice.exceptions.ErrorType

class InvalidTokenExcepion(
    val token: String,
) : BasicApplicationException(
    type = ErrorType.TOKEN_NOT_VALID,
    title = "The provided token is not valid",
    detail = "The token($token) is not valid"
)