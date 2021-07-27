package it.aw2commerce.walletservice.dto

class TransactionsPageDTO(
    val pageNumber: Int,
    val transactions: List<TransactionDTO>
)