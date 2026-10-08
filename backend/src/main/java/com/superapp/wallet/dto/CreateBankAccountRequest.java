package com.superapp.wallet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateBankAccountRequest(
        @NotBlank(message = "Account holder name is required")
        @Size(max = 255)
        String accountHolderName,

        @NotBlank(message = "Bank name is required")
        @Size(max = 128)
        String bankName,

        @NotBlank(message = "Account number is required")
        @Pattern(regexp = "^[0-9]{9,18}$", message = "Invalid bank account number")
        String accountNumber,

        @NotBlank(message = "IFSC code is required")
        @Pattern(regexp = "^[A-Z]{4}0[A-Z0-9]{6}$", message = "Invalid IFSC Code format")
        String ifscCode,

        @Size(max = 100)
        String upiVpa
) {}
