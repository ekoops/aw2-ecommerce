package it.polito.ecommerce.catalogservice.domain

import io.r2dbc.spi.Row
import it.polito.ecommerce.catalogservice.dto.UserDTO
import it.polito.ecommerce.catalogservice.dto.UserDetailsDTO
import it.polito.ecommerce.catalogservice.exceptions.user.ActionNotPermittedException
import it.polito.ecommerce.catalogservice.exceptions.user.InconsistentUserException
import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Transient
import reactor.core.publisher.Mono
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

    @Transient
    private val rolesList: List<Rolename>,

    @field:NotNull(message = "A name must be specified")
    @field:NotEmpty(message = "The name field must be not empty")
    val name: String,

    @field:NotNull(message = "A name must be specified")
    @field:NotEmpty(message = "The name field must be not empty")
    val surname: String,

    @field:NotNull(message = "A name must be specified")
    @field:NotEmpty(message = "The name field must be not empty")
    val deliveryAddress: String? = null

) {

    @field:NotEmpty(message = "The roles field must be not empty")
    val roles: String = rolesList.distinct().joinToString(separator = ",")

    fun getRolenames(): Set<Rolename> {
        return this.roles.split(",").map { Rolename.valueOf(it) }.toSet()
    }


    fun addRolename(rolename: Rolename): User? {
        if (this.roles.contains(rolename.toString())) return null
        val newRoleList = rolesList + rolename
        return User(
            id = id,
            username = username,
            password = password,
            email = email,
            isEnabled = isEnabled,
            isLocked = isLocked,
            rolesList = newRoleList,
            name = name,
            surname = surname,
            deliveryAddress = deliveryAddress
        )
    }

    fun removeRolename(role: Rolename): User? {
        val roleList = this.roles.split(",").toMutableList()
        if (roleList.size == 1) return null
        val hasBeenRemoved = roleList.remove(role.toString())
        if (hasBeenRemoved) {
            return User(
                id = id,
                username = username,
                password = password,
                email = email,
                isEnabled = isEnabled,
                isLocked = isLocked,
                rolesList = roleList.map{Rolename.valueOf(it)},
                name = name,
                surname = surname,
                deliveryAddress = deliveryAddress
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
            isEnabled = true,
            isLocked = isLocked,
            rolesList = rolesList,
            name = name,
            surname = surname,
            deliveryAddress = deliveryAddress
        )
    }

    fun disableUser(): User? {
        if (!this.isEnabled) return null
        return User(
            id = id,
            username = username,
            password = password,
            email = email,
            isEnabled = false,
            isLocked = isLocked,
            rolesList = rolesList,
            name = name,
            surname = surname,
            deliveryAddress = deliveryAddress
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
            isEnabled = isEnabled,
            isLocked = true,
            rolesList = rolesList,
            name = name,
            surname = surname,
            deliveryAddress = deliveryAddress
        )
    }

    fun unlockUser(): User? {
        if (!this.isLocked) return null
        return User(
            id = id,
            username = username,
            password = password,
            email = email,
            isEnabled = isEnabled,
            isLocked = false,
            rolesList = rolesList,
            name = name,
            surname = surname,
            deliveryAddress = deliveryAddress
        )
    }

    fun updateUserInfo(
        name: String?,
        surname: String?,
        deliveryAddress: String?,
        password: String?
    ): User {
        return User(
            id = id,
            username = username,
            password = password?: this.password,
            email = email,
            isEnabled = isEnabled,
            isLocked = isLocked,
            rolesList = rolesList,
            name = name?: this.name,
            surname = surname?: this.surname,
            deliveryAddress = deliveryAddress?: this.deliveryAddress
        )
    }

}

fun User.toUserDetailsDTO(): UserDetailsDTO {
    val id = this.id ?: throw InconsistentUserException(
        "User id is undefined"
    )
    return UserDetailsDTO(
        id = id,
        username = this.username,
        password = this.password,
        email = this.email,
        roles = this.getRolenames(),
        isEnabled = this.isEnabled,
        isLocked = this.isLocked,
        name = this.name,
        surname = this.surname,
        deliveryAddress = this.deliveryAddress
    )
}

fun User.toUserDTO(): UserDTO {
    val id = this.id ?: throw InconsistentUserException(
        "User id is undefined"
    )
    return UserDTO(
        id = id,
        username = this.username,
        email = this.email,
        name = this.name,
        surname = this.surname,
        deliveryAddress = this.deliveryAddress
    )
}


fun Row.extractUser(): User{
   return User(
       id = this.get("id").toString().toLong(),
       username = this.get("username").toString(),
       email = this.get("email").toString(),
       password = this.get("password").toString(),
       isEnabled = this.get("is_enabled").toString()== "1",
       isLocked = this.get("is_locked").toString() == "1",
       rolesList = this.get("roles").toString().split(",").map { Rolename.valueOf(it) },
       name = this.get("name").toString(),
       surname = this.get("surname").toString(),
       deliveryAddress = this.get("delivery_address")?.toString()
   )
//    println(">>>>>>>>>>>> extractedUser = $user")
}