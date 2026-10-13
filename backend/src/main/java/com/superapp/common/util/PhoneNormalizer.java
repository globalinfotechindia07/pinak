package com.superapp.common.util;

import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;

import java.util.regex.Pattern;

/**
 * Enterprise utility for Indian mobile number normalization, validation, and PII masking.
 * Standardizes all phone inputs to E.164 (+91XXXXXXXXXX) format.
 */
public final class PhoneNormalizer {

    private static final Pattern INDIAN_MOBILE_PATTERN = Pattern.compile("^[6-9]\\d{9}$");

    private PhoneNormalizer() {
        // Prevent instantiation
    }

    /**
     * Normalizes a raw phone number into standard Indian E.164 format (+91XXXXXXXXXX).
     *
     * @param rawPhone raw string from request
     * @return normalized phone number, e.g. "+919876543210"
     * @throws AppException if input is null, blank, or invalid Indian mobile number
     */
    public static String normalize(String rawPhone) {
        if (rawPhone == null || rawPhone.isBlank()) {
            throw new AppException("Phone number cannot be empty.", ApiError.VALIDATION_FAILED, 400);
        }

        // Remove all whitespace, dashes, brackets
        String cleaned = rawPhone.replaceAll("[\\s\\-\\(\\)]", "");

        // Extract last 10 digits if formatted with +91 or leading 0
        String digitsOnly = cleaned.replaceAll("[^0-9]", "");

        String tenDigits;
        if (digitsOnly.length() == 10) {
            tenDigits = digitsOnly;
        } else if (digitsOnly.length() == 11 && digitsOnly.startsWith("0")) {
            tenDigits = digitsOnly.substring(1);
        } else if (digitsOnly.length() >= 12 && digitsOnly.startsWith("91")) {
            tenDigits = digitsOnly.substring(digitsOnly.length() - 10);
        } else {
            throw new AppException("Invalid phone number format. Please provide a valid 10-digit mobile number.", ApiError.VALIDATION_FAILED, 400);
        }

        if (!INDIAN_MOBILE_PATTERN.matcher(tenDigits).matches()) {
            throw new AppException("Invalid Indian mobile number. Mobile numbers must begin with 6, 7, 8, or 9.", ApiError.VALIDATION_FAILED, 400);
        }

        return "+91" + tenDigits;
    }

    /**
     * Extracts only the 10 digits without the country code prefix.
     */
    public static String getTenDigits(String rawPhone) {
        String normalized = normalize(rawPhone);
        return normalized.substring(3);
    }

    /**
     * Checks if a phone number string is valid without throwing an exception.
     */
    public static boolean isValid(String rawPhone) {
        try {
            normalize(rawPhone);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Masks a phone number for secure, PII-compliant logging (e.g. "+91 987****210").
     */
    public static String mask(String phone) {
        if (phone == null || phone.isBlank()) {
            return "[EMPTY]";
        }
        try {
            String normalized = normalize(phone);
            return normalized.substring(0, 6) + "****" + normalized.substring(normalized.length() - 3);
        } catch (Exception e) {
            return "******";
        }
    }
}
