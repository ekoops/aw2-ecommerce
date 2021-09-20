package it.aw2commerce.walletservice.exceptions.security

import it.aw2commerce.walletservice.exceptions.ErrorType
import it.aw2commerce.walletservice.exceptions.wallet.BasicApplicationException

class BadAuthenticationException : BasicApplicationException(
    type = ErrorType.INTERNAL_ERROR,
    title = "Bad authentication",
    detail = "Bad authentication"
)