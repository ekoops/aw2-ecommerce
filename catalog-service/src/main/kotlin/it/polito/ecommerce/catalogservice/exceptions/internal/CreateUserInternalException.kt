package it.polito.ecommerce.catalogservice.exceptions.internal

import it.polito.ecommerce.catalogservice.exceptions.BasicApplicationException
import it.polito.ecommerce.catalogservice.exceptions.ErrorType
import org.springframework.mail.MailException


class CreateUserInternalException(
    type: ErrorType = ErrorType.CREATE_USER_ERROR,
    title: String = "User creation failed",
    detail: String = "Failed to complete the user creation"
) : BasicApplicationException(
    type = type,
    title = title,
    detail = detail
) {
    companion object {
        fun from(ex: Exception): CreateUserInternalException = when(ex) {
            is MailException -> CreateUserInternalException(
                type = ErrorType.MAIL_ERROR,
                title = "An error occurred in email system",
                detail = "There was an error during email sending"
            )
            else -> CreateUserInternalException()
        }
    }
}