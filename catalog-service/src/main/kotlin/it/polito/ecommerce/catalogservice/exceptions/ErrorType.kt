package it.polito.ecommerce.catalogservice.exceptions

enum class ErrorType {
    UNAUTHORIZED,
    INVALID_ENTITY,
    INVALID_FIELDS,
    INTERNAL_ERROR,
    NO_SUCH_ENTITY,
    NO_SUCH_USER,
    SERVICE_UNAVAILABLE,
    TYPE_MISMATCH,
    NO_SUCH_VERIFICATION_TOKEN,
    TOKEN_EXPIRED,
    TOKEN_NOT_VALID,
    USER_ALREADY_EXISTS,
    NO_SUCH_ROLE,
    MAIL_ERROR,
    ACTION_NOT_PERMITTED,
    CREATE_USER_ERROR,
    SIGNIN_ERROR,
    FORBIDDEN,
    BAD_CREDENTIALS,
    VERIFY_USER_ERROR,
    METHOD_NOT_ALLOWED,
}