package it.polito.ecommerce.catalogservice.exceptions.user

import it.polito.ecommerce.catalogservice.exceptions.BasicApplicationException
import it.polito.ecommerce.catalogservice.exceptions.ErrorType

class ActionNotPermittedException (
    override val message: String
) : BasicApplicationException(
    type = ErrorType.ACTION_NOT_PERMITTED,
    title = "The action is not permitted",
    detail = message
)