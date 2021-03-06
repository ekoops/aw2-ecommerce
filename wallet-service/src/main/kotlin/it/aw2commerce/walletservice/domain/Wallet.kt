package it.aw2commerce.walletservice.domain

import it.aw2commerce.walletservice.dto.WalletDTO
import it.aw2commerce.walletservice.exceptions.wallet.InconsistentWalletException
import javax.persistence.Column
import javax.validation.constraints.Min
import javax.persistence.*
import javax.validation.constraints.NotNull


@Entity(name = "Wallet")
@Table(name = "wallet")
class Wallet(

    @NotNull
    @Column(name = "customerId", nullable = false)
    var customerId: Long,

    @OneToMany(
        mappedBy = "wallet",
        targetEntity = Transaction::class,
        fetch = FetchType.LAZY
    )
    var transactions: Set<Transaction>,



    @field:Min(value = 0, message = "The wallet amount must be greater or equal than zero")
    @Column(name = "amount", nullable = false)
    var amount: Long = 0

) : EntityBase<Long>()

fun Wallet.toWalletDTO(): WalletDTO {
    if (this.getId() == null) {
        throw InconsistentWalletException(
            message = "Wallet id or wallet customer id are undefined"
        )
    }
    return WalletDTO(
        id = this.getId()!!,
        customerId = this.customerId,
        amount = this.amount.toDouble() / 100.0
    )
}