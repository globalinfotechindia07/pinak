package com.superapp.offer.specification;

import com.superapp.offer.entity.Offer;
import com.superapp.offer.enums.OfferApprovalStatus;
import com.superapp.offer.enums.OfferStatus;
import com.superapp.offer.enums.OfferType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class OfferSpecification {

    public static Specification<Offer> filter(
            UUID merchantId,
            UUID storeId,
            UUID categoryId,
            OfferStatus status,
            OfferApprovalStatus approvalStatus,
            OfferType offerType,
            Boolean activeOnly) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (merchantId != null) {
                predicates.add(cb.equal(root.get("merchantId"), merchantId));
            }

            if (storeId != null) {
                predicates.add(cb.equal(root.get("storeId"), storeId));
            }

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("categoryId"), categoryId));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (approvalStatus != null) {
                predicates.add(cb.equal(root.get("approvalStatus"), approvalStatus));
            }

            if (offerType != null) {
                predicates.add(cb.equal(root.get("type"), offerType));
            }

            if (Boolean.TRUE.equals(activeOnly)) {
                Instant now = Instant.now();
                predicates.add(cb.lessThanOrEqualTo(root.get("validFrom"), now));
                predicates.add(cb.greaterThanOrEqualTo(root.get("validTo"), now));
                predicates.add(cb.equal(root.get("status"), OfferStatus.ACTIVE));
                predicates.add(cb.equal(root.get("approvalStatus"), OfferApprovalStatus.APPROVED));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
