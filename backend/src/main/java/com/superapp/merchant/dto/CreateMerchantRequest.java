package com.superapp.merchant.dto;

import com.superapp.merchant.validation.ValidBusinessName;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.UUID;

public record CreateMerchantRequest(
        @NotBlank(message = "Business name must not be blank")
        @Size(min = 2, max = 255, message = "Business name must be between 2 and 255 characters")
        @ValidBusinessName(message = "Business name contains invalid characters")
        String businessName,

        @Size(max = 255, message = "Legal name must not exceed 255 characters")
        String legalName,

        @Size(max = 2000, message = "Description must not exceed 2000 characters")
        String description,

        UUID categoryId,

        @Size(min = 7, max = 20, message = "Phone must be between 7 and 20 characters")
        @Pattern(regexp = "^$|^(\\+91[\\-\\s]?)?[6-9]\\d{9}$|^[+]?[0-9]{7,20}$", message = "Invalid phone number format")
        String phone,

        @Email(message = "Invalid email address")
        @Size(max = 255, message = "Email must not exceed 255 characters")
        String email,

        @Size(max = 255, message = "Website URL must not exceed 255 characters")
        String website,

        @Pattern(regexp = "^$|^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$", message = "Invalid GSTIN format (e.g. 27AABCU9603R1ZM)")
        String gstin,

        @Pattern(regexp = "^$|^[A-Z]{5}[0-9]{4}[A-Z]{1}$", message = "Invalid PAN format (e.g. AABCU9603R)")
        String pan,

        @Pattern(regexp = "^$|^[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z]{2,64}$", message = "Invalid UPI VPA format (e.g. brand@icici)")
        String bankUpiId,

        @DecimalMin(value = "0.00", message = "Take-rate cannot be negative")
        @DecimalMax(value = "100.00", message = "Take-rate cannot exceed 100%")
        BigDecimal commissionRate,

        @Size(max = 100, message = "State must not exceed 100 characters")
        String state,

        @Size(max = 100, message = "District must not exceed 100 characters")
        String district,

        @Size(max = 100, message = "City must not exceed 100 characters")
        String city,

        @Size(max = 20, message = "Pincode must not exceed 20 characters")
        String pincode,

        @Size(max = 2000, message = "Address must not exceed 2000 characters")
        String address,

        @Size(max = 128, message = "Bank name must not exceed 128 characters")
        String bankName,

        @Size(max = 255, message = "Account holder name must not exceed 255 characters")
        String accountHolderName,

        @Size(max = 64, message = "Bank account number must not exceed 64 characters")
        String bankAccountNumber,

        @Size(max = 16, message = "IFSC code must not exceed 16 characters")
        String bankIfsc
) {
    // 16-arg constructor for previous callers
    public CreateMerchantRequest(String businessName, String legalName, String description,
                                 UUID categoryId, String phone, String email, String website,
                                 String gstin, String pan, String bankUpiId, BigDecimal commissionRate,
                                 String state, String district, String city, String pincode, String address) {
        this(businessName, legalName, description, categoryId, phone, email, website, gstin, pan, bankUpiId, commissionRate, state, district, city, pincode, address, null, null, null, null);
    }

    // 11-arg constructor for previous callers
    public CreateMerchantRequest(String businessName, String legalName, String description,
                                 UUID categoryId, String phone, String email, String website,
                                 String gstin, String pan, String bankUpiId, BigDecimal commissionRate) {
        this(businessName, legalName, description, categoryId, phone, email, website, gstin, pan, bankUpiId, commissionRate, null, null, null, null, null, null, null, null, null);
    }

    // 7-arg constructor for tests
    public CreateMerchantRequest(String businessName, String legalName, String description,
                                 UUID categoryId, String phone, String email, String website) {
        this(businessName, legalName, description, categoryId, phone, email, website, null, null, null, null, null, null, null, null, null, null, null, null, null);
    }

    // Backward-compatible constructor for existing tests
    public CreateMerchantRequest(String businessName, UUID categoryId, UUID ownerUserId) {
        this(businessName, null, null, categoryId, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    }
}
