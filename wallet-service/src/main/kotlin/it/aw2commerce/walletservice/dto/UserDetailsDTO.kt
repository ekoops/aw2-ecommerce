package it.aw2commerce.walletservice.dto

import it.aw2commerce.walletservice.domain.Rolename
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority


data class UserDetailsDTO(
    private val id: Long,
    private val username: String,
    private val password: String? = null,
    private val email: String,
    private val role: Rolename,
    private val isEnabled: Boolean,
    private val isLocked: Boolean = false,
    private val name: String,
    private val surname: String,
    private val deliveryAddress: String? = null

) : UserDetails {
    fun getId(): Long = id

    override fun getUsername(): String = username

    override fun getPassword(): String? = password

    fun getEmail(): String = email

    override fun isEnabled(): Boolean = isEnabled

    override fun getAuthorities(): MutableCollection<out GrantedAuthority> {
        return mutableListOf(SimpleGrantedAuthority(this.role.toString()))
    }

    override fun isAccountNonExpired(): Boolean {
        return true
    }

    override fun isAccountNonLocked(): Boolean {
        return !this.isLocked
    }

    override fun isCredentialsNonExpired(): Boolean {
        return true
    }

    fun getName(): String = name

    fun getSurname(): String = surname

    fun getDeliveryAddress(): String? = deliveryAddress
}
