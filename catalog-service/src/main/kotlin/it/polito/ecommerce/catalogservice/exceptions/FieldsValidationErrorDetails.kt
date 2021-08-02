package it.polito.ecommerce.catalogservice.exceptions

class FieldErrorReasons(
    val field: String,
    val reasons: List<String>
)

class FieldsValidationErrorDetails(
    detail: String? = null,
    val invalidFields: List<FieldErrorReasons>
) : ErrorDetails(
    type = ErrorType.INVALID_FIELDS,
    title = "The provided fields are not valid",
    detail = detail
)