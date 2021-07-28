package it.aw2commerce.walletservice.exceptions

import it.aw2commerce.walletservice.exceptions.wallet.BasicApplicationException

class InvalidIntervalException(
    detail: String? = null
) : BasicApplicationException(
    type = ErrorType.INVALID_INTERVAL,
    title = "The provided interval is invalid",
    detail = detail
)