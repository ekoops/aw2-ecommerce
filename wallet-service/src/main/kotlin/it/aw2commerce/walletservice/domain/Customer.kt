package it.aw2commerce.walletservice.domain

import javax.persistence.*
import javax.validation.constraints.NotEmpty

@Entity(name = "Customer")
@Table(name = "customer")
class Customer(
   // @OneToOne(fetch = FetchType.LAZY)
   // @JoinColumn(name = "id", updatable = false, nullable = false)
    @MapsId
    var user: String,
   //todo questo dovebbe essere: var user: User, ma devo tenermi anche qui gli utenti?

    @field:NotEmpty(message = "The customer name cannot be empty")
    @Column(name = "name", nullable = false)
    var name: String,

    @field:NotEmpty(message = "The customer surname cannot be empty")
    @Column(name = "surname", nullable = false)
    var surname: String,

    @field:NotEmpty(message = "The customer delivery address cannot be empty")
    @Column(name = "delivery_address", nullable = false)
    var deliveryAddress: String,

    ) : EntityBase<Long>() {
    @OneToMany(mappedBy = "customer", targetEntity = Wallet::class, fetch = FetchType.LAZY)
    var wallets: Set<Wallet> = emptySet()
}