package it.polito.ecommerce.catalogservice.exceptions

open class ErrorDetails(
    val type: ErrorType,
    open val title: String,    // human readable description
    val detail: String? = null      // detailed description for developers
) {
    constructor(basicApplicationException: BasicApplicationException): this(
        type = basicApplicationException.type,
        title = basicApplicationException.title,
        detail = basicApplicationException.detail
    )
}