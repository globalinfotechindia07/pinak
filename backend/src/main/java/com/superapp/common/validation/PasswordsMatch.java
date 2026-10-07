package com.superapp.common.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/**
 * Cross-field Bean Validation annotation that verifies two String fields on a class
 * contain the same value. Attach on the class (TYPE target).
 *
 * <pre>
 * {@literal @}PasswordsMatch(field = "newPassword", matchField = "confirmNewPassword")
 * public record MyRequest(String newPassword, String confirmNewPassword) {}
 * </pre>
 */
@Documented
@Constraint(validatedBy = PasswordsMatchValidator.class)
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface PasswordsMatch {
    String message() default "Passwords do not match";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};

    /** Name of the primary field (e.g. "newPassword"). */
    String field();

    /** Name of the confirmation field (e.g. "confirmNewPassword"). */
    String matchField();
}
