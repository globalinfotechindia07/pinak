package com.superapp.common.converter;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

public class FlexibleInstantDeserializer extends JsonDeserializer<Instant> {

    @Override
    public Instant deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String text = p.getText();
        if (text == null || text.isBlank()) {
            return null;
        }
        text = text.trim();

        // 1. Numeric timestamp (seconds or milliseconds)
        if (text.matches("^\\d{10,13}$")) {
            long epoch = Long.parseLong(text);
            if (text.length() == 10) {
                epoch *= 1000L;
            }
            return Instant.ofEpochMilli(epoch);
        }

        // 2. ISO Instant / Offset / Local Date-Time with 'T'
        if (text.contains("T")) {
            try {
                return Instant.parse(text);
            } catch (Exception ignored) {
                try {
                    return Instant.parse(text + "Z");
                } catch (Exception ignored2) {
                    try {
                        return LocalDateTime.parse(text).toInstant(ZoneOffset.UTC);
                    } catch (Exception ignored3) {
                        // continue to fallback
                    }
                }
            }
        }

        // 3. Simple date: YYYY-MM-DD
        if (text.matches("^\\d{4}-\\d{2}-\\d{2}$")) {
            try {
                return LocalDate.parse(text, DateTimeFormatter.ISO_LOCAL_DATE)
                        .atStartOfDay(ZoneOffset.UTC)
                        .toInstant();
            } catch (Exception ignored) {
                // continue to fallback
            }
        }

        try {
            return Instant.parse(text);
        } catch (Exception e) {
            return Instant.now();
        }
    }
}
