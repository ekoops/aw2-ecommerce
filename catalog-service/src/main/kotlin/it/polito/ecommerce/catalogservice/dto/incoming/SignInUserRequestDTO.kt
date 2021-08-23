package it.polito.ecommerce.catalogservice.dto.incoming

import javax.validation.constraints.NotEmpty
import javax.validation.constraints.NotNull
import javax.validation.constraints.Pattern
import javax.validation.constraints.Size

data class SignInUserRequestDTO(
    @field:NotNull(message = "A username must be specified")
    @field:NotEmpty(message = "A username cannot be empty")
    @field:Size(min = 4, max = 32, message = "Username must be 4 to 32 characters long")
    val username: String,
    @field:NotNull(message = "A password must be specified")
    @field:NotEmpty(message = "A password cannot be empty")
    @field:Pattern(
        regexp = "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@\$!%*?&])[A-Za-z\\d@\$!%*?&]{8,20}",
        message = "A password must have at least one lowercase letter (a-z)," +
                "one uppercase letter (A-Z), one number and a special character among @\$!%*?&"
    )
    val password: String,

    val role: String
)