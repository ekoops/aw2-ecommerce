package it.aw2commerce.walletservice.exceptions.transaction

import it.aw2commerce.walletservice.exceptions.EntityNotFoundException
import it.aw2commerce.walletservice.exceptions.ErrorType

class TransactionNotFoundException(
    id: Long
) : EntityNotFoundException(
    type = ErrorType.NO_SUCH_TRANSACTION,
    title = "Cannot find the requested transaction",
    detail = "Transaction with the given id($id) doesn't exist"
)