package it.aw2commerce.walletservice.controllers

import it.aw2commerce.walletservice.exceptions.*
import it.aw2commerce.walletservice.exceptions.transaction.TransactionFailedException
import it.aw2commerce.walletservice.exceptions.wallet.BasicApplicationException
import org.springframework.http.HttpStatus
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.HttpMediaTypeNotSupportedException
import org.springframework.web.HttpRequestMethodNotSupportedException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException
import javax.validation.ConstraintViolationException

@RestControllerAdvice
class ControllersAdvisor {
    @ExceptionHandler(MethodArgumentTypeMismatchException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun typeMismatchException(ex: MethodArgumentTypeMismatchException): ErrorDetails {
        val requiredClassType = ex.requiredType.toString().split(" ").last()
        return ErrorDetails(
            type = ErrorType.TYPE_MISMATCH,
            title = "Unexpected provided data type",
            detail = "The provided data should be of type $requiredClassType"
        )
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun httpMediaTypeExceptionHandler(ex: HttpMediaTypeNotSupportedException): ErrorDetails = ErrorDetails(
        type = ErrorType.UNSUPPORTED_MEDIA_TYPE,
        title = "The request body cannot be parsed",
        detail = "The provided media type is not supported"
    )

    @ExceptionHandler(HttpMessageNotReadableException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun httpMessageNotReadableExceptionHandler(ex: HttpMessageNotReadableException): ErrorDetails = ErrorDetails(
        type = ErrorType.INVALID_ENTITY,
        title = "The request body cannot be parsed",
        detail = "The provided request body should follows the right DTO specification"
    )

    @ExceptionHandler(ConstraintViolationException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun constraintViolationExceptionHandler(ex: ConstraintViolationException): ErrorDetails {
        val violatedConstraints = ex.constraintViolations.map { it.message }
        return ContraintsViolationErrorDetails(
            violatedConstraints = violatedConstraints,
            detail = "The provided fields should follows the right endpoint specification"
        )
    }
    @ExceptionHandler(HttpRequestMethodNotSupportedException::class)
    @ResponseStatus(HttpStatus.METHOD_NOT_ALLOWED)
    fun methodNotAllowedExceptionHandler(ex: HttpRequestMethodNotSupportedException): ErrorDetails = ErrorDetails(
        type = ErrorType.METHOD_NOT_ALLOWED,
        title = "The request method is not allowed",
        detail = "The method ${ex.method} not allowed"
    )

    @ExceptionHandler(MethodArgumentNotValidException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun methodArgumentNotValidExceptionHandler(ex: MethodArgumentNotValidException): FieldsValidationErrorDetails {
        ex.allErrors
        val fieldsErrorReasonsList = ex.fieldErrors.groupBy { it.field }.map { (field, errorList) ->
            FieldErrorReasons(
                field = field,
                reasons = errorList.map { error -> error.defaultMessage ?: "generic invalidity reason" }
            )
        }
        return FieldsValidationErrorDetails(
            invalidFields = fieldsErrorReasonsList,
            detail = "The provided entity should follows the right DTO entity specification"
        )
    }

//    @ExceptionHandler(DisabledException::class, LockedException::class, ActionNotPermittedException::class)
//    @ResponseStatus(HttpStatus.FORBIDDEN)
//    fun forbiddenExceptionHandler(ex: Exception): ErrorDetails = when (ex) {
//        is ActionNotPermittedException -> ErrorDetails(ex)
//        else -> ErrorDetails(
//            type = ErrorType.FORBIDDEN,
//            title = "The access is forbidden",
//            detail = "The access is forbidden"
//        )
//    }

//    @ExceptionHandler(BadCredentialsException::class)
//    @ResponseStatus(HttpStatus.UNAUTHORIZED)
//    fun badCredentialsExceptionHandler(ex: BadCredentialsException) = ErrorDetails(
//        type = ErrorType.BAD_CREDENTIALS,
//        title = "Failed to authenticate",
//        detail = "Failed to authenticate with the provided credentials"
//    )
//
//    @ExceptionHandler(BadAuthenticationException::class)
//    @ResponseStatus(HttpStatus.UNAUTHORIZED)
//    fun badCredentialsExceptionHandler(ex: BadAuthenticationException) = ErrorDetails(
//        type = ErrorType.INTERNAL_ERROR,
//        title = "An internal server error occurred",
//        detail = "This is a generic internal server error response"
//    )

//    @ExceptionHandler(UsernameNotFoundException::class)
//    @ResponseStatus(HttpStatus.NOT_FOUND)
//    fun usernameNotFoundExceptionHandler(ex: UsernameNotFoundException): ErrorDetails {
//        return ErrorDetails(
//            type = ErrorType.NO_SUCH_USER,
//            title = "User not found",
//            detail = ex.message
//        )
//    }

    // Custom Exception handlers
    @ExceptionHandler(TransactionFailedException::class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    fun unprocessableEntityHandler(ex: BasicApplicationException): ErrorDetails = ErrorDetails(ex)

    @ExceptionHandler(EntityNotFoundException::class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    fun entityNotFoundExceptionHandler(ex: EntityNotFoundException): ErrorDetails = ErrorDetails(ex)

//    @ExceptionHandler(CreateUserInternalException::class, VerifyUserInternalException::class)
//    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
//    fun internalExceptionHandler(ex: BasicApplicationException): ErrorDetails = ErrorDetails(ex)

    @ExceptionHandler(BasicApplicationException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun basicApplicationExceptionHandler(ex: BasicApplicationException): ErrorDetails = ErrorDetails(ex)

//    @ExceptionHandler(org.springframework.security.access.AccessDeniedException::class)
//    @ResponseStatus(HttpStatus.FORBIDDEN)
//    fun accessDeniedExceptionHandler(ex: org.springframework.security.access.AccessDeniedException): ErrorDetails = ErrorDetails(
//        type = ErrorType.FORBIDDEN,
//        title = "Forbidden request",
//        detail = ex.message
//    )

    // Generic exception handler
    @ExceptionHandler(Throwable::class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    fun defaultExceptionHandler(ex: Throwable): ErrorDetails {
        ex.printStackTrace()
        return ErrorDetails(
            type = ErrorType.INTERNAL_ERROR,
            title = "An internal server error occurred",
            detail = "This is a generic internal server error response"
        )
    }
}