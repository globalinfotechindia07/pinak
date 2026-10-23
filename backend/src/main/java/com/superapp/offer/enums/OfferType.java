package com.superapp.offer.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum OfferType {
    PERCENTAGE_DISCOUNT,
    FIXED_DISCOUNT,
    CASHBACK,
    BOGO;

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
            case "BOGO", "BUY_ONE_GET_ONE", "1+1" -> BOGO;
            default -> throw new IllegalArgumentException("Unknown offer type: " + value);
        };
    }
}
