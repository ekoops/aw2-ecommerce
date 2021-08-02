package it.polito.ecommerce.catalogservice.domain

import it.polito.ecommerce.catalogservice.dto.UserDTO
import it.polito.ecommerce.catalogservice.dto.UserDetailsDTO
import it.polito.ecommerce.catalogservice.exceptions.user.ActionNotPermittedException
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

    val rolesList: List<Rolename>

){

    @field:NotEmpty(message = "The roles field must be not empty")
    private val roles: String = rolesList.distinct().joinToString(separator = ",")

    fun getRolenames(): Set<Rolename> {
        return this.roles.split(",").map { Rolename.valueOf(it) }.toSet()
    }

    fun addRolename(rolename: Rolename): User? {
        if (this.roles.contains(rolename.toString())) return null
        val newRoleList= rolesList+rolename
        return User(
            id = id,
            username = username,
            password = password,
            email = email,
            isEnabled= isEnabled,
            isLocked = isLocked,
            rolesList = newRoleList,
        )
    }

    fun removeRolename(role: Rolename): User? {
        val roleList = this.roles.split(",").toMutableList()
        if (roleList.size == 1) return null
        val hasBeenRemoved= roleList.remove(role.toString())
        if (hasBeenRemoved) {
            return User(
                id = id,
                username = username,
                password = password,
                email = email,
                isEnabled= isEnabled,
                isLocked = isLocked,
                rolesList = rolesList
            )
        }
        return null
    }

    fun enableUser(): User? {
        if (this.isEnabled) return null
        return User(
            id = id,
            username = username,
            password = password,
            email = email,
            isEnabled= true,
            isLocked = isLocked,
            rolesList = rolesList
        )
    }

    fun disableUser(): User? {
        if (!this.isEnabled) return null
        return User(
            id = id,
            username = username,
            password = password,
            email = email,
            isEnabled= false,
            isLocked = isLocked,
            rolesList = rolesList
        )
    }

    fun lockUser(): User? {
        if (this.getRolenames().contains(Rolename.ADMIN)) {
            throw ActionNotPermittedException("Cannot lock an admin")
        }
        if (this.isLocked) return null
        return User(
            id = id,
            username = username,
            password = password,
            email = email,
            isEnabled= isEnabled,
            isLocked = true,
            rolesList = rolesList
        )
    }

    fun unlockUser(): User? {
        if (!this.isLocked) return null
        return User(
            id = id,
            username = username,
            password = password,
            email = email,
            isEnabled= isEnabled,
            isLocked = false,
            rolesList = rolesList
        )
    }

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