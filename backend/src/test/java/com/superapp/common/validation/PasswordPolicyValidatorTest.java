package com.superapp.common.validation;

import jakarta.validation.ConstraintValidatorContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class PasswordPolicyValidatorTest {

    private PasswordPolicyValidator validator;
    private ConstraintValidatorContext ctx;

    @BeforeEach
    void setUp() {
        validator = new PasswordPolicyValidator();
        ctx = Mockito.mock(ConstraintValidatorContext.class);
        var builder = Mockito.mock(ConstraintValidatorContext.ConstraintViolationBuilder.class);
        when(ctx.buildConstraintViolationWithTemplate(any())).thenReturn(builder);
        when(builder.addConstraintViolation()).thenReturn(ctx);
    }

    @Test void validPassword() { assertThat(validator.isValid("StrongPass@1", ctx)).isTrue(); }
    @Test void tooShort()      { assertThat(validator.isValid("Sh@1", ctx)).isFalse(); }
    @Test void noUppercase()   { assertThat(validator.isValid("weakpass@1", ctx)).isFalse(); }
    @Test void noLowercase()   { assertThat(validator.isValid("WEAKPASS@1", ctx)).isFalse(); }
    @Test void noDigit()       { assertThat(validator.isValid("NoDigits@Pass", ctx)).isFalse(); }
    @Test void noSpecial()     { assertThat(validator.isValid("NoSpecial1", ctx)).isFalse(); }
    @Test void nullIsValid()   { assertThat(validator.isValid(null, ctx)).isTrue(); } // @NotBlank handles null
    @Test void exactlyAtMin()  { assertThat(validator.isValid("Pass@123", ctx)).isTrue(); }
}
