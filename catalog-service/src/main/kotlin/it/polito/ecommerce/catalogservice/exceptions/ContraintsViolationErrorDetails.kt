package it.polito.ecommerce.catalogservice.exceptions

class ContraintsViolationErrorDetails(
    detail: String? = null,
    val violatedConstraints: List<String>
) : ErrorDetails(
    type = ErrorType.INVALID_FIELDS,
    title = "Fields constraints violation occurred",
    detail = detail
)