package it.polito.ecommerce.catalogservice.exceptions.user.emailverificationtoken

import it.polito.ecommerce.catalogservice.exceptions.EntityNotFoundException
import it.polito.ecommerce.catalogservice.exceptions.ErrorType

class EmailVerificationTokenNotFoundException(
    token: String
) : EntityNotFoundException(
    type = ErrorType.NO_SUCH_VERIFICATION_TOKEN,
    title = "Cannot find the provided verification token",
    detail = "The provided email verification token($token) doesn't exist"
)