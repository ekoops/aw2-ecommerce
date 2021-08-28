package it.aw2commerce.walletservice.dto

import it.aw2commerce.walletservice.domain.Rolename
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority


data class UserDetailsDTO(
    private val id: Long,
    private val username: String,
    private val email: String,
    private val role: Rolename,
) : UserDetails {
    fun getId(): Long = id

    override fun getUsername(): String = username

    override fun getPassword(): String = ""

    override fun isEnabled(): Boolean = true

    override fun getAuthorities(): MutableCollection<out GrantedAuthority> {
        return mutableListOf(SimpleGrantedAuthority(this.role.toString()))
    }

    override fun isAccountNonExpired(): Boolean {
        return true
    }

    override fun isAccountNonLocked(): Boolean {
        return true
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