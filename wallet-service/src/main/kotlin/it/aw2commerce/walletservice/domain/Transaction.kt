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
        name = "purchasing_wallet",
        referencedColumnName = "id",
        nullable = false
    )
    var purchasingWallet: Wallet,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "recharging_wallet",
        referencedColumnName = "id",
        nullable = false
    )
    var rechargingWallet: Wallet,

    @field:Min(
        value = 0,
        message = "The transaction amount must be greater or equal than zero"
    )
    @Column(name = "amount", nullable = false)
    var amount: Long,

    @Column(name = "time_instant", nullable = false)
    var timeInstant: LocalDateTime,
) : EntityBase<Long>()

fun Transaction.toTransactionDTO(): TransactionDTO {
    if (this.getId() == null || this.purchasingWallet.getId() == null ||
        this.rechargingWallet.getId() == null) {
        throw InconstistentTransactionException(
            "Transaction id or from/to wallet id are undefined"
        )
    }
    return TransactionDTO(
        id = this.getId()!!,
        purchasingWalletId = this.purchasingWallet.getId()!!,
        rechargingWalletId = this.rechargingWallet.getId()!!,
        amount = this.amount.toDouble() / 100.0,
        timeInstant = this.timeInstant
    )
}