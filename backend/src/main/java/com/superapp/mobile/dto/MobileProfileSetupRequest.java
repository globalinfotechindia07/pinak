package com.superapp.mobile.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

@Schema(description = "Request body to complete mandatory customer profile setup (Screen 08)")
public record MobileProfileSetupRequest(
        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
        @Schema(description = "Customer full legal name", example = "Rahul Sharma")
        String fullName,

        @Email(message = "Invalid email address format")
        @Schema(description = "Customer email address for notifications and digital receipts", example = "rahul.sharma@example.com")
        String email,

        @NotBlank(message = "City is required")
        @Schema(description = "Primary operational city (e.g. Ahmedabad, Mumbai)", example = "Ahmedabad")
        String city,

        @Schema(description = "State of residence (e.g. Gujarat, Maharashtra)", example = "Gujarat")
        String state,

        @Schema(description = "District of residence (e.g. Ahmedabad, Surat)", example = "Ahmedabad")
        String district,

        @Schema(description = "Postal PIN code (e.g. 380015)", example = "380015")
        String pincode,

        @Schema(description = "Gender: MALE, FEMALE, OTHER", example = "MALE")
        String gender,

        @Schema(description = "Residential or delivery street address", example = "101, Galaxy Heights, S.G. Highway")
        String address,

        @Past(message = "Birthday must be in the past")
        @Schema(description = "Date of birth (YYYY-MM-DD) for birthday milestone rewards", example = "1998-05-15")
        LocalDate birthday,

        @Schema(description = "Optional referral code of inviting friend", example = "FRIEND100")
        String referralCode,

        @Schema(description = "List of category IDs selected from /api/v1/discovery/categories", example = "[\"3fa85f64-5717-4562-b3fc-2c963f66afa6\"]")
        List<String> categoryPreferences
) {}
