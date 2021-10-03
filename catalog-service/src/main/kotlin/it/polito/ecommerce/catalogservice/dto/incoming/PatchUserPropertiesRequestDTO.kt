package it.polito.ecommerce.catalogservice.dto.incoming

import javax.validation.constraints.Pattern

data class PatchUserPropertiesRequestDTO(
    val isLocked: Boolean?,
    val isEnabled: Boolean?,
    val name: String?,
    val surname: String?,
    val deliveryAddress: String?,
    @field:Pattern(
        regexp = "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@\$!%*?&])[A-Za-z\\d@\$!%*?&]{8,20}",
        message = "A password must have at least one lowercase letter (a-z)," +
                "one uppercase letter (A-Z), one number and a special character among @\$!%*?&"
    )
    val password: String?
)