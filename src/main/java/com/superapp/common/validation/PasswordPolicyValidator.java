package com.superapp.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

/**
 * Implements password policy validation:
 * - Length: 8–128 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one digit (0-9)
 * - At least one special character (@$!%*?&#^()_+-)
 */
public class PasswordPolicyValidator implements ConstraintValidator<PasswordPolicy, String> {

    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 128;

    private static final Pattern UPPERCASE   = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE   = Pattern.compile("[a-z]");
    private static final Pattern DIGIT       = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL     = Pattern.compile("[@$!%*?&#^()_+\\-]");

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null) {
            // Null is handled by @NotBlank on the field; don't double-report
            return true;
        }

        if (password.length() < MIN_LENGTH || password.length() > MAX_LENGTH) {
            customMessage(context, "Password must be between " + MIN_LENGTH + " and " + MAX_LENGTH + " characters.");
            return false;
        }

        if (!UPPERCASE.matcher(password).find()) {
            customMessage(context, "Password must contain at least one uppercase letter.");
            return false;
        }

        if (!LOWERCASE.matcher(password).find()) {
            customMessage(context, "Password must contain at least one lowercase letter.");
            return false;
        }

        if (!DIGIT.matcher(password).find()) {
            customMessage(context, "Password must contain at least one digit.");
            return false;
        }

        if (!SPECIAL.matcher(password).find()) {
            customMessage(context, "Password must contain at least one special character (@$!%*?&#^()_+-).");
            return false;
        }

        return true;
    }

    private void customMessage(ConstraintValidatorContext ctx, String message) {
        ctx.disableDefaultConstraintViolation();
        ctx.buildConstraintViolationWithTemplate(message).addConstraintViolation();
    }
}
