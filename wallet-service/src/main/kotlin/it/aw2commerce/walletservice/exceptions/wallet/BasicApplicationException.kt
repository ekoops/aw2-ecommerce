package it.aw2commerce.walletservice.exceptions.wallet

import it.aw2commerce.walletservice.exceptions.ErrorType

open class BasicApplicationException (
    val type: ErrorType,
    val title: String,
    val detail: String? = null
): Exception()