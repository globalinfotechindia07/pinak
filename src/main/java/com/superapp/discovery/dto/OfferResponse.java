package com.superapp.discovery.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.superapp.discovery.entity.Offer;
import java.math.BigDecimal;
import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record OfferResponse(
        String id,
        String title,
        String description,
        String type,
        BigDecimal value,
        Instant validFrom,
        Instant validTo,
        String status
) implements java.io.Serializable {
    public static OfferResponse fromEntity(Offer offer) {
        if (offer == null) return null;
        return new OfferResponse(
                offer.getId().toString(),
                offer.getTitle(),
                offer.getDescription(),
                offer.getType() != null ? offer.getType().name() : null,
                offer.getValue(),
                offer.getValidFrom(),
                offer.getValidTo(),
                offer.getStatus() != null ? offer.getStatus().name() : null
        );
    }
}
