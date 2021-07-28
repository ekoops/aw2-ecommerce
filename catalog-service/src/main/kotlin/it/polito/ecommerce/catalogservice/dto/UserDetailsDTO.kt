package it.polito.ecommerce.catalogservice.dto

import it.polito.ecommerce.catalogservice.domain.Rolename
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority

data class UserDetailsDTO(
    private val id: Long,
    private val username: String,
    private val password: String? = null,
    private val email: String,
    private val roles: Set<Rolename>,
    private val isEnabled: Boolean,
    private val isLocked: Boolean = false

) : UserDetails {
    fun getId(): Long = id

    override fun getUsername(): String = username

    override fun getPassword(): String? = password

    fun getEmail(): String = email

    override fun isEnabled(): Boolean = isEnabled

    override fun getAuthorities(): MutableCollection<out GrantedAuthority> {
        return this.roles.map { SimpleGrantedAuthority(it.toString()) }.toMutableList()
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
}
