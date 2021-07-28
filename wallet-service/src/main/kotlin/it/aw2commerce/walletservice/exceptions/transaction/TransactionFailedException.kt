package it.aw2commerce.walletservice.exceptions.transaction

import it.aw2commerce.walletservice.exceptions.ErrorType
import it.aw2commerce.walletservice.exceptions.wallet.BasicApplicationException

class TransactionFailedException(
    detail: String?
) : BasicApplicationException(
    type = ErrorType.TRANSACTION_FAILED,
    title = "The transaction cannot be created",
    detail = detail
)