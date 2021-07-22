package it.aw2commerce.walletservice.exceptions

import it.aw2commerce.walletservice.exceptions.wallet.BasicApplicationException

open class EntityNotFoundException(
    type: ErrorType = ErrorType.NO_SUCH_ENTITY,
    title: String = "Cannot find the requested entity",
    detail: String?
) : BasicApplicationException(
    type = type,
    title = title,
    detail = detail
)