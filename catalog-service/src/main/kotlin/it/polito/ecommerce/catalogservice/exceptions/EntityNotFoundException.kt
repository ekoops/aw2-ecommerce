package it.polito.ecommerce.catalogservice.exceptions

open class EntityNotFoundException(
    type: ErrorType = ErrorType.NO_SUCH_ENTITY,
    title: String = "Cannot find the requested entity",
    detail: String?
) : BasicApplicationException(
    type = type,
    title = title,
    detail = detail
)