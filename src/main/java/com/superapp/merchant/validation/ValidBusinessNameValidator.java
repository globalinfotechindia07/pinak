package com.superapp.merchant.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

/**
 * Validates business names: allows alphanumeric, spaces, and safe business punctuation (&, ., ', -, ,).
 * Strictly disallows control characters, HTML/script tags, and angle brackets.
 */
public class ValidBusinessNameValidator implements ConstraintValidator<ValidBusinessName, String> {

    private static final Pattern BUSINESS_NAME_PATTERN = Pattern.compile("^[a-zA-Z0-9\\s&.,'\\-_/()]+$");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.trim().isEmpty()) {
            return true; // Let @NotBlank handle null/empty checks
        }
        return BUSINESS_NAME_PATTERN.matcher(value.trim()).matches();
    }
}
