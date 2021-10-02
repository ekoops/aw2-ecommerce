package it.aw2commerce.walletservice.exceptions.wallet

import it.aw2commerce.walletservice.exceptions.ErrorType

class CustomerAlreadyHasWalletException():BasicApplicationException(
    type = ErrorType.ACTION_NOT_PERMITTED,
    title = "Cannot create wallet",
    detail = "Customer with the given id already has wallet"
)