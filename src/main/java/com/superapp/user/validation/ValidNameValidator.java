package com.superapp.user.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

/**
 * Validates that names contain only letters, spaces, apostrophes, and hyphens.
 * Rejects control characters, HTML/script tags, numbers, and symbols.
 */
public class ValidNameValidator implements ConstraintValidator<ValidName, String> {

    // Supports international unicode letters, spaces, apostrophes, and hyphens
    private static final Pattern NAME_PATTERN = Pattern.compile("^[\\p{L}][\\p{L}\\s'\\-]*$");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.trim().isEmpty()) {
            return true; // Use @NotBlank or @NotNull to validate presence if required
        }
        return NAME_PATTERN.matcher(value.trim()).matches();
    }
}
