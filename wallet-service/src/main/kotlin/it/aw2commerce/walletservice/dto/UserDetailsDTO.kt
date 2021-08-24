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
    private val roles: Set<Rolename>,
    private val isEnabled: Boolean,
    private val isLocked: Boolean = false
//    private val isAccountNonExpired: Boolean = true,
//    private val isAccountNonLocked: Boolean = true,
//    private val isCredentialsNonExpired: Boolean = true,
//    private val authorities: MutableCollection<out GrantedAuthority> = mutableListOf()
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
//
//fun UserDetailsDTO.toUser() = User(
//    email = this.getEmail(),
//    username = this.getUsername(),
//    password = this.getPassword(),
//    isEnabled = this.isEnabled(),
//    roles = this.getRoles(),
//)