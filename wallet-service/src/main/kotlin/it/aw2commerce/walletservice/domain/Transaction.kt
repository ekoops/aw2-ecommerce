package it.aw2commerce.walletservice.domain

import it.aw2commerce.walletservice.dto.TransactionDTO
import it.aw2commerce.walletservice.exceptions.transaction.InconstistentTransactionException
import java.time.LocalDateTime
import javax.persistence.*
import javax.validation.constraints.Min

@Entity(name = "Transaction")
@Table(name = "transaction")
class Transaction(

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "wallet",
        referencedColumnName = "id",
        nullable = false
    )
    var wallet: Wallet,


    @Column(name = "amount", nullable = false)
    var amount: Long,

    @Column(name = "time_instant", nullable = false)
    var timeInstant: LocalDateTime,

    @Column(name = "referenceId" , nullable = false , unique = true)
    var referenceId: String,



) : EntityBase<Long>()

fun Transaction.toTransactionDTO(): TransactionDTO {
    if (this.getId() == null || this.wallet.getId() == null){
        throw InconstistentTransactionException(
            "Transaction id or wallet id are undefined"
        )

    }
    return TransactionDTO(
        id = this.getId()!!,
        walletId = this.wallet.getId()!!,
        amount = this.amount.toDouble() / 100.0,
        timeInstant = this.timeInstant,
        referenceId = this.referenceId
    )
}