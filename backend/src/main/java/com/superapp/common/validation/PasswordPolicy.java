package com.superapp.common.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/**
 * Custom Bean Validation annotation for password policy enforcement.
 * <p>
 * Policy: min 8 chars, max 128, at least one uppercase, lowercase, digit, and special character.
 */
@Documented
@Constraint(validatedBy = PasswordPolicyValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface PasswordPolicy {
    String message() default "Password must be 8-128 characters and contain at least one uppercase letter, lowercase letter, digit, and special character (@$!%*?&#^()_+)";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
