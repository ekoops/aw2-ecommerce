package it.polito.ecommerce.catalogservice.exceptions.security

import it.polito.ecommerce.catalogservice.exceptions.BasicApplicationException
import it.polito.ecommerce.catalogservice.exceptions.ErrorType

class BadAuthenticationException : BasicApplicationException(
    type = ErrorType.INTERNAL_ERROR,
    title = "Bad authentication",
    detail = "Bad authentication"
)