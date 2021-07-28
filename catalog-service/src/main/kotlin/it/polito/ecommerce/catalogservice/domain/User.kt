package it.polito.ecommerce.catalogservice.domain

import it.polito.ecommerce.catalogservice.dto.UserDTO
import it.polito.ecommerce.catalogservice.dto.UserDetailsDTO
import it.polito.ecommerce.catalogservice.exceptions.user.InconsistentUserException
import org.springframework.data.annotation.Id
import javax.validation.constraints.NotEmpty
import javax.validation.constraints.NotNull

data class User(
    @Id
    val id: Long? = null,

    @field:NotNull(message = "A username must be specified")
    @field:NotEmpty(message = "The username field must be not empty")
    val username: String,

    @field:NotNull(message = "An email must be specified")
    @field:NotEmpty(message = "The email field must be not empty")
    val email: String,

    @field:NotNull(message = "A password must be specified")
    @field:NotEmpty(message = "The password field must be not empty")
    val password: String,

    val isEnabled: Boolean = false,

    val isLocked: Boolean = false,

//    val customer: Customer,

//    val emailVerificationToken: EmailVerificationToken,

    val role: Rolename

){

    @field:NotEmpty(message = "The roles field must be not empty")
    private val roles: String = role.toString()

    fun getRolenames(): Set<Rolename> {
        return this.roles.split(",").map { Rolename.valueOf(it) }.toSet()
    }

//TODO: capire come implementare i metodi che cambiano le properties
/*
    fun addRolename(rolename: Rolename): Boolean {
        if (this.roles.contains(rolename.toString())) return false
        this.roles += ",$rolename"
        return true
    }

    fun removeRolename(rolename: Rolename): Boolean {
        val roleList = this.roles.split(",").toMutableList()
        if (roleList.size == 1) return false
        val hasBeenRemoved = roleList.remove(rolename.toString())
        if (hasBeenRemoved) {
            this.roles = roleList.joinToString(separator = ",")
        }
        return hasBeenRemoved
    }

    fun enableUser(): Boolean {
        if (this.isEnabled) return false
        witheEnableUser() = true
        return true
    }
    fun disableUser(): Boolean {
        if (!this.isEnabled) return false
        this.isEnabled = false
        return true
    }

    fun lockUser(): Boolean {
        if (this.getRolenames().contains(Rolename.ADMIN)) {
            throw ActionNotPermittedException("Cannot lock an admin")
        }
        if (this.isLocked) return false
        this.isLocked = true
        return true
    }

    fun unlockUser(): Boolean {
        if (!this.isLocked) return false
        this.isLocked = false
        return true
    }

 */
}

fun User.toUserDetailsDTO(): UserDetailsDTO {
    val id = this.id ?: throw InconsistentUserException(
        "Transaction id or from/to wallet id are undefined"
    )
    return UserDetailsDTO(
        id = id,
        username = this.username,
        password = this.password,
        email = this.email,
        roles = this.getRolenames(),
        isEnabled = this.isEnabled,
        isLocked = this.isLocked
    )
}

fun User.toUserDTO(): UserDTO {
    val id = this.id ?: throw InconsistentUserException(
        "Transaction id or from/to wallet id are undefined"
    )
    return UserDTO(
        id = id,
        username = this.username,
        email = this.email
    )
}