package it.aw2commerce.walletservice.exceptions.wallet

import it.aw2commerce.walletservice.exceptions.EntityNotFoundException
import it.aw2commerce.walletservice.exceptions.ErrorType

class WalletNotFoundException(
    id: Long
) : EntityNotFoundException(
    type = ErrorType.NO_SUCH_WALLET,
    title = "Cannot find the requested wallet",
    detail = "Wallet with the given id($id) doesn't exist"
)