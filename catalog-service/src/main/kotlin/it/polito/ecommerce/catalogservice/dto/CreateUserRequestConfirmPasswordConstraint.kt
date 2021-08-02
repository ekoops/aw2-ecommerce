package it.polito.ecommerce.catalogservice.dto

import it.polito.ecommerce.catalogservice.dto.incoming.CreateUserRequestDTO
import javax.validation.Constraint
import javax.validation.ConstraintValidator
import javax.validation.ConstraintValidatorContext
import javax.validation.Payload
import kotlin.reflect.KClass


@Constraint(validatedBy = [CreateUserRequestConfirmPassword::class])
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class CreateUserRequestConfirmPasswordConstraint (
    val message: String = "Invalid confirmation password",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)

class CreateUserRequestConfirmPassword
    : ConstraintValidator<CreateUserRequestConfirmPasswordConstraint, CreateUserRequestDTO> {
    override fun initialize(constraintAnnotation: CreateUserRequestConfirmPasswordConstraint?) {}
    override fun isValid(
        createUserRequestDTO: CreateUserRequestDTO,
        cxt: ConstraintValidatorContext
    ): Boolean {
        cxt.buildConstraintViolationWithTemplate(
            "The password confirmation field must be equal to the password field"
        ).addPropertyNode( "confirmPassword" ).addConstraintViolation()
        return createUserRequestDTO.password == createUserRequestDTO.confirmPassword
    }
}