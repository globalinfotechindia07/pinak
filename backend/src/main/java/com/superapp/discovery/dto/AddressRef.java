package com.superapp.discovery.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AddressRef(
        String line1,
        String line2,
        String city,
        String state,
        String pincode
) implements java.io.Serializable {
    public AddressRef(String line1, String city, String state, String pincode) {
        this(line1, null, city, state, pincode);
    }
}
