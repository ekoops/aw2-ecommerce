package it.polito.ecommerce.catalogservice.exceptions.user.customer

import it.polito.ecommerce.catalogservice.exceptions.EntityNotFoundException
import it.polito.ecommerce.catalogservice.exceptions.ErrorType

class CustomerNotFoundException(
    id: Long
) : EntityNotFoundException(
    type = ErrorType.NO_SUCH_CUSTOMER,
    title = "Cannot find the requested customer",
    detail = "Customer with the given id($id) doesn't exist"
)