package it.polito.ecommerce.catalogservice.controllers

import it.polito.ecommerce.catalogservice.dto.incoming.PatchUserPropertiesRequestDTO
import it.polito.ecommerce.catalogservice.services.implementations.UserDetailsServiceImpl
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import javax.validation.Valid

@RequestMapping("/users")
@RestController
class UserController(
    private val userDetailsService: UserDetailsServiceImpl
) {

//  This endpoint allows an admin to enable or disable an user

    @PreAuthorize("hasAuthority('ADMIN')")
    @PatchMapping("/{userId}")
    suspend fun patchUser(
        @Valid @RequestBody patchUserPropertiesDTO: PatchUserPropertiesRequestDTO,
        @PathVariable("userId") userId: Long
    ) {
        if (patchUserPropertiesDTO.isLocked != null) {
            if (patchUserPropertiesDTO.isLocked) userDetailsService.lockUser(userId)
            else userDetailsService.unlockUser(userId)
        }

        if (patchUserPropertiesDTO.isEnabled != null) {
            if (patchUserPropertiesDTO.isEnabled) userDetailsService.enableUser(userId)
            else userDetailsService.disableUser(userId)
        }
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PatchMapping("/addRole/{userId}")
    suspend fun addRole(
        @RequestParam("role", required = true) role: String,
        @PathVariable("userId") username: String
    ) : Boolean =
        userDetailsService.addUserRole(username,role)

    @PreAuthorize("hasAuthority('ADMIN')")
    @PatchMapping("/removeRole/{userId}")
    suspend fun removeRole(
        @RequestParam("role", required = true) role: String,
        @PathVariable("userId") username: String
    ) : Boolean =
        userDetailsService.removeUserRole(username,role)

}