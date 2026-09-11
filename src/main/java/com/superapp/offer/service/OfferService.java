package com.superapp.offer.service;

import com.superapp.offer.dto.*;
import com.superapp.offer.entity.Offer;
import com.superapp.offer.enums.OfferApprovalStatus;
import com.superapp.offer.enums.OfferStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public interface OfferService {

    // Merchant Operations
    MerchantOfferResponse createMerchantOffer(CreateOfferRequest request, UUID currentUserId);

    Page<MerchantOfferResponse> getMerchantOffers(
            UUID storeId,
            OfferStatus status,
            OfferApprovalStatus approvalStatus,
            Pageable pageable,
            UUID currentUserId
    );

    MerchantOfferResponse getMerchantOfferById(UUID offerId, UUID currentUserId);

    MerchantOfferResponse updateMerchantOffer(UUID offerId, UpdateOfferRequest request, UUID currentUserId);

    OfferApprovalResponse submitOfferForApproval(UUID offerId, UUID currentUserId);

    // Customer Operations
    CustomerOfferDetailResponse getCustomerOfferDetails(UUID offerId);

    // Admin Operations
    Page<MerchantOfferResponse> getAdminOffers(Specification<Offer> spec, Pageable pageable);

    MerchantOfferResponse getAdminOfferById(UUID offerId);

    OfferApprovalResponse approveOffer(UUID offerId, UUID adminUserId);

    OfferApprovalResponse rejectOffer(UUID offerId, RejectOfferRequest request, UUID adminUserId);
}
