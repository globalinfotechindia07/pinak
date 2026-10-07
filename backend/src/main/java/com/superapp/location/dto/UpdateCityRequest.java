package com.superapp.location.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateCityRequest(
        @NotBlank(message = "City name must not be blank")
        @Size(min = 2, max = 100, message = "City name must be between 2 and 100 characters")
        String name,

        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "Slug must contain only lowercase alphanumeric characters separated by single hyphens")
        @Size(max = 100, message = "Slug must not exceed 100 characters")
        String slug,

        @NotBlank(message = "State must not be blank")
        @Size(min = 2, max = 100, message = "State must be between 2 and 100 characters")
        String state,

        @Size(max = 100, message = "Country must not exceed 100 characters")
        String country
) {
    public UpdateCityRequest(String name, String slug, String state) {
        this(name, slug, state, "India");
    }
}
