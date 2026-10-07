package com.superapp.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.lang.reflect.RecordComponent;

/**
 * Validator for {@link PasswordsMatch}.
 * Uses reflection to read named record components (or regular bean getters) from the target object.
 */
public class PasswordsMatchValidator implements ConstraintValidator<PasswordsMatch, Object> {

    private String field;
    private String matchField;

    @Override
    public void initialize(PasswordsMatch annotation) {
        this.field = annotation.field();
        this.matchField = annotation.matchField();
    }

    @Override
    public boolean isValid(Object value, ConstraintValidatorContext context) {
        if (value == null) {
            return true; // let @NotNull handle nulls
        }
        try {
            String fieldValue = getFieldValue(value, field);
            String matchValue = getFieldValue(value, matchField);

            if (fieldValue == null && matchValue == null) return true;
            if (fieldValue == null || !fieldValue.equals(matchValue)) {
                // Attach the violation to the confirmNewPassword field for a better error UX
                context.disableDefaultConstraintViolation();
                context.buildConstraintViolationWithTemplate(context.getDefaultConstraintMessageTemplate())
                        .addPropertyNode(matchField)
                        .addConstraintViolation();
                return false;
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private String getFieldValue(Object obj, String fieldName) throws Exception {
        // Support Java records (RecordComponent) first, then fall back to getters
        Class<?> clazz = obj.getClass();
        if (clazz.isRecord()) {
            for (RecordComponent rc : clazz.getRecordComponents()) {
                if (rc.getName().equals(fieldName)) {
                    rc.getAccessor().setAccessible(true);
                    Object result = rc.getAccessor().invoke(obj);
                    return result != null ? result.toString() : null;
                }
            }
        }
        // Fallback: try direct field access
        java.lang.reflect.Field f = clazz.getDeclaredField(fieldName);
        f.setAccessible(true);
        Object result = f.get(obj);
        return result != null ? result.toString() : null;
    }
}
