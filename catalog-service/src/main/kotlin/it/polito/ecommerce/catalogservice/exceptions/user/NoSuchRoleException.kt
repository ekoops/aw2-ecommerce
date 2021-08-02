package it.polito.ecommerce.catalogservice.exceptions.user

import it.polito.ecommerce.catalogservice.exceptions.BasicApplicationException
import it.polito.ecommerce.catalogservice.exceptions.ErrorType

class NoSuchRoleException(
    role: String
) : BasicApplicationException(
    type = ErrorType.NO_SUCH_ROLE,
    title = "Cannot parse the provided role",
    detail = "Role($role) doesn't exist"
)