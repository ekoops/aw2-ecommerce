package it.polito.ecommerce.catalogservice.controllers

import it.polito.ecommerce.catalogservice.dto.incoming.PatchUserPropertiesRequestDTO
import it.polito.ecommerce.catalogservice.services.implementations.UserDetailsServiceImpl
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.context.ReactiveSecurityContextHolder
import org.springframework.web.bind.annotation.*
import javax.validation.Valid

@RequestMapping("/users")
@RestController
class UserController(
    private val userDetailsService: UserDetailsServiceImpl
) {

//  This endpoint allows an admin to enable or disable an user

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
//            if (patchUserPropertiesDTO.isEnabled) userDetailsService.enableUser(userId)
//            else userDetailsService.disableUser(userId)
//        }
//    }

    @PatchMapping("locking/{userId}")
    suspend fun lockingUser(
        @Valid @RequestBody patchUserPropertiesDTO: PatchUserPropertiesRequestDTO,
        @PathVariable("userId") userId: Long
    ) {
        if (patchUserPropertiesDTO.isLocked != null) {
            if (patchUserPropertiesDTO.isLocked) userDetailsService.lockUser(userId)
            else userDetailsService.unlockUser(userId)
        }
    }

    @PatchMapping("enabling/{userId}")
    suspend fun enablingUser(
        @Valid @RequestBody patchUserPropertiesDTO: PatchUserPropertiesRequestDTO,
        @PathVariable("userId") userId: Long
    ) {

        if (patchUserPropertiesDTO.isEnabled != null) {
            if (patchUserPropertiesDTO.isEnabled) userDetailsService.enableUser(userId)
            else userDetailsService.disableUser(userId)
        }
    }

    @PatchMapping("/addRole/{userId}")
    suspend fun addRole(
        @RequestParam("role", required = true) role: String,
        @PathVariable("userId") username: String
    ) : Boolean =
        userDetailsService.addUserRole(username,role)

    @PatchMapping("/removeRole/{userId}")
    suspend fun removeRole(
        @RequestParam("role", required = true) role: String,
        @PathVariable("userId") username: String
    ) : Boolean =
        userDetailsService.removeUserRole(username,role)

/*
    TODO: add method for handling name, surname, deliveryAddress updating. they should be accessible also from normal customer
*/
    //TODO: the user has to be able to modify only his info

    @PreAuthorize("#userId == java.security.Principal.id")
    @PatchMapping("/updateUserInfo/{userId}")
    suspend fun patchUserInformation(
        @Valid @RequestBody patchUserPropertiesDTO: PatchUserPropertiesRequestDTO,
        @PathVariable("userId") userId: Long
    ) {
        val (_, _, name, surname, deliveryAddress, password) = patchUserPropertiesDTO
        if (patchUserPropertiesDTO.name != null ||
            patchUserPropertiesDTO.surname != null ||
            patchUserPropertiesDTO.deliveryAddress != null) {
            userDetailsService.updateUserInformation(userId, name, surname, deliveryAddress, password)
        }
    }



}