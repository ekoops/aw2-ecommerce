package it.polito.ecommerce.catalogservice.controllers

import it.polito.ecommerce.catalogservice.exceptions.*
import it.polito.ecommerce.catalogservice.exceptions.internal.CreateUserInternalException
import it.polito.ecommerce.catalogservice.exceptions.internal.VerifyUserInternalException
import it.polito.ecommerce.catalogservice.exceptions.security.BadAuthenticationException
import it.polito.ecommerce.catalogservice.exceptions.user.ActionNotPermittedException
import org.springframework.context.support.DefaultMessageSourceResolvable
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.authentication.DisabledException
import org.springframework.security.authentication.LockedException
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.bind.support.WebExchangeBindException
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException
import org.springframework.web.server.ResponseStatusException
import java.util.stream.Collectors
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


    @ExceptionHandler(HttpMessageNotReadableException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun httpMessageNotReadableExceptionHandler(ex: HttpMessageNotReadableException): ErrorDetails = ErrorDetails(
        type = ErrorType.INVALID_ENTITY,
        title = "The request body cannot be parsed",
        detail = "The provided request body should follows the right DTO specification"
    )

    //TODO: vedere se questa gestione delle eccezioni per la validazione dei campio dei DTO va bene e d in caso non vada bene provare a integrarla con quella di sotto
    @ExceptionHandler(WebExchangeBindException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun constraintViolationExceptionHandler2(ex: WebExchangeBindException): ResponseEntity<List<String?>> {
        val errors = ex.getBindingResult()
            .getAllErrors()
            .stream()
            .map(DefaultMessageSourceResolvable::getDefaultMessage)
            .collect(Collectors.toList())
        return ResponseEntity.badRequest().body(errors);
    }

    @ExceptionHandler(ConstraintViolationException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun constraintViolationExceptionHandler(ex: ConstraintViolationException): ErrorDetails {
        val violatedConstraints = ex.constraintViolations.map { it.message }
        return ContraintsViolationErrorDetails(
            violatedConstraints = violatedConstraints,
            detail = "The provided fields should follows the right endpoint specification"
        )
    }

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

    @ExceptionHandler(DisabledException::class, LockedException::class, ActionNotPermittedException::class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    fun forbiddenExceptionHandler(ex: Exception): ErrorDetails = when (ex) {
        is ActionNotPermittedException -> ErrorDetails(ex)
        else -> ErrorDetails(
            type = ErrorType.FORBIDDEN,
            title = "The access is forbidden",
            detail = "The access is forbidden"
        )
    }

    @ExceptionHandler(BadCredentialsException::class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    fun badCredentialsExceptionHandler(ex: BadCredentialsException) = ErrorDetails(
        type = ErrorType.BAD_CREDENTIALS,
        title = "Failed to authenticate",
        detail = "Failed to authenticate with the provided credentials"
    )

    @ExceptionHandler(BadAuthenticationException::class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    fun badCredentialsExceptionHandler(ex: BadAuthenticationException) = ErrorDetails(
        type = ErrorType.INTERNAL_ERROR,
        title = "An internal server error occurred",
        detail = "This is a generic internal server error response"
    )

    @ExceptionHandler(UsernameNotFoundException::class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    fun usernameNotFoundExceptionHandler(ex: UsernameNotFoundException): ErrorDetails {
        return ErrorDetails(
            type = ErrorType.NO_SUCH_USER,
            title = "User not found",
            detail = ex.message
        )
    }

    // Custom Exception handlers

    @ExceptionHandler(EntityNotFoundException::class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    fun entityNotFoundExceptionHandler(ex: EntityNotFoundException): ErrorDetails = ErrorDetails(ex)

    @ExceptionHandler(CreateUserInternalException::class, VerifyUserInternalException::class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    fun internalExceptionHandler(ex: BasicApplicationException): ErrorDetails = ErrorDetails(ex)

    @ExceptionHandler(BasicApplicationException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun basicApplicationExceptionHandler(ex: BasicApplicationException): ErrorDetails = ErrorDetails(ex)

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException::class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    fun accessDeniedExceptionHandler(ex: org.springframework.security.access.AccessDeniedException): ErrorDetails = ErrorDetails(
        type = ErrorType.FORBIDDEN,
        title = "Forbidden request",
        detail = ex.message
    )

    @ExceptionHandler(ResponseStatusException::class)
    @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
    fun serviceUnavailableExceptionHandler(ex: ResponseStatusException): ErrorDetails = ErrorDetails(
        type = ErrorType.SERVICE_UNAVAILABLE,
        title = "Service temporary unavailable",
        detail = ex.message
    )

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