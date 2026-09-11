package com.superapp.offer.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum OfferType {
    PERCENTAGE_DISCOUNT,
    FIXED_DISCOUNT,
    CASHBACK;

    @JsonCreator
    public static OfferType fromString(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toUpperCase();
        return switch (normalized) {
            case "PERCENTAGE_DISCOUNT", "PERCENTAGE" -> PERCENTAGE_DISCOUNT;
            case "FIXED_DISCOUNT", "FLAT" -> FIXED_DISCOUNT;
            case "CASHBACK" -> CASHBACK;
            default -> throw new IllegalArgumentException("Unknown offer type: " + value);
        };
    }
}
