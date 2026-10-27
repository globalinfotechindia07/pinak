package com.superapp.common.converter;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;
import java.util.UUID;

public class FlexibleUuidDeserializer extends JsonDeserializer<UUID> {

    @Override
    public UUID deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String text = p.getText();
        if (text == null || text.isBlank() || "all".equalsIgnoreCase(text.trim()) || "null".equalsIgnoreCase(text.trim())) {
            return null;
        }
        try {
            return UUID.fromString(text.trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
