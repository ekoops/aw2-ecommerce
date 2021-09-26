package it.polito.ecommerce.catalogservice.dto.incoming

import it.polito.ecommerce.catalogservice.dto.CreateUserRequestConfirmPasswordConstraint
import javax.validation.constraints.*

@CreateUserRequestConfirmPasswordConstraint
data class CreateUserRequestDTO(
    @field:NotNull(message = "An email must be specified")
    @field:Email(message = "A valid email address must be specified")
    val email: String,
    @field:NotNull(message = "A username must be specified")
    @field:Size(min = 4, max = 32, message = "Username must be 4 to 32 characters long")
    val username: String,
    @field:NotNull(message = "A password must be specified")
    @field:Pattern(
        regexp = "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@\$!%*?&])[A-Za-z\\d@\$!%*?&]{8,20}",
        message = "A password must have at least one lowercase letter (a-z)," +
                "one uppercase letter (A-Z), one number and a special character among @\$!%*?&"
    )
    val password: String,
    val confirmPassword: String,

    @field:NotNull(message = "The user name must be specified")
    @field:NotEmpty(message = "The user name cannot be empty")
    val name: String,
    @field:NotNull(message = "The user surname must be specified")
    @field:NotEmpty(message = "The user surname cannot be empty")
    val surname: String,
    @field:NotNull(message = "The user delivery address must be specified")
    @field:NotEmpty(message = "The user delivery address cannot be empty")
    val deliveryAddress: String
)
