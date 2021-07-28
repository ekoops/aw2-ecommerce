package it.polito.ecommerce.catalogservice.exceptions

open class BasicApplicationException (
    val type: ErrorType,
    val title: String,
    val detail: String? = null
): Exception()