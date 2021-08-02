package it.polito.ecommerce.catalogservice.dto.incoming

import javax.validation.constraints.NotNull

data class PatchUserPropertiesRequestDTO(
    @field:NotNull(message = "A value for isLocked must be specified")
    val isLocked: Boolean?,
    val isEnabled: Boolean?
)