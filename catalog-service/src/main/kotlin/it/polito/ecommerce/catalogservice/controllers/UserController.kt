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
    /*
    This endpoint allows an admin to enable or disable an user
     */
//    @PreAuthorize("hasAuthority('ADMIN')")
//    @PatchMapping("/{userId}")
//    suspend fun patchUser(
//        @Valid @RequestBody patchUserPropertiesDTO: PatchUserPropertiesRequestDTO,
//        @PathVariable("userId") userId: Long
//    ) {
//        if (patchUserPropertiesDTO.isLocked != null) {
//            if (patchUserPropertiesDTO.isLocked) userDetailsService.lockUser(userId)
//            else userDetailsService.unlockUser(userId)
//        }
//
//        if (patchUserPropertiesDTO.isEnabled != null) {
//            val user = userDetailsService.getUserById(userId)
//            if (patchUserPropertiesDTO.isEnabled) userDetailsService.enableUser(user.username)
//            else userDetailsService.disableUser(user.username)
//        }
//    }
}