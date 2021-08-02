package it.polito.ecommerce.catalogservice.exceptions.internal

import it.polito.ecommerce.catalogservice.exceptions.BasicApplicationException
import it.polito.ecommerce.catalogservice.exceptions.ErrorType

class VerifyUserInternalException(
    type: ErrorType = ErrorType.VERIFY_USER_ERROR,
    title: String = "User verification failed",
    detail: String = "Failed to complete the user verification"
) : BasicApplicationException(
    type = type,
    title = title,
    detail = detail
)