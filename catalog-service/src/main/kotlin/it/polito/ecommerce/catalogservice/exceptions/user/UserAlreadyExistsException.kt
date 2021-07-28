package it.polito.ecommerce.catalogservice.exceptions.user

import it.polito.ecommerce.catalogservice.exceptions.BasicApplicationException
import it.polito.ecommerce.catalogservice.exceptions.ErrorType

class UserAlreadyExistsException(
    username: String,
    email: String
) : BasicApplicationException(
    type = ErrorType.USER_ALREADY_EXISTS,
    title = "User already exists",
    detail = "Username(${username}) or email(${email}) already present"
)