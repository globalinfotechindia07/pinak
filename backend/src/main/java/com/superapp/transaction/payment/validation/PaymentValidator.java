package com.superapp.transaction.payment.validation;

import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.enums.MerchantStatus;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.offer.entity.Offer;
import com.superapp.offer.enums.OfferApprovalStatus;
import com.superapp.offer.enums.OfferStatus;
import com.superapp.offer.repository.OfferRepository;
import com.superapp.store.entity.Store;
import com.superapp.store.enums.StoreStatus;
import com.superapp.store.repository.StoreRepository;
import com.superapp.user.entity.Role;
import com.superapp.user.entity.User;
import com.superapp.user.entity.UserStatus;
import com.superapp.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
public class PaymentValidator {

    private final UserRepository userRepository;
    private final MerchantRepository merchantRepository;
    private final StoreRepository storeRepository;
    private final OfferRepository offerRepository;

    public PaymentValidator(
            UserRepository userRepository,
            MerchantRepository merchantRepository,
            StoreRepository storeRepository,
            OfferRepository offerRepository) {
        this.userRepository = userRepository;
        this.merchantRepository = merchantRepository;
        this.storeRepository = storeRepository;
        this.offerRepository = offerRepository;
    }

    public record ValidatedEntities(
            User customer,
            Merchant merchant,
            Store store,
            Offer offer
    ) {}

    public ValidatedEntities validatePaymentInitiation(UUID customerId, UUID storeId, UUID offerId) {
        // 1. Validate Customer
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new AppException("Customer not found", ApiError.USER_NOT_FOUND, 404));

        if (customer.getRole() != Role.CUSTOMER) {
            throw new AppException("Only customers can initiate payment", ApiError.FORBIDDEN, 403);
        }

        if (customer.getStatus() != UserStatus.ACTIVE) {
            throw new AppException("Customer account is not active", ApiError.ACCOUNT_INACTIVE, 403);
        }

        // 2. Validate Store
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new AppException("Store not found", ApiError.STORE_NOT_FOUND, 404));

        if (store.getStatus() != StoreStatus.ACTIVE || store.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new AppException("Store is not available for transactions", ApiError.INVALID_STORE_STATE, 409);
        }

        // 3. Validate Merchant
        Merchant merchant = merchantRepository.findById(store.getMerchantId())
                .orElseThrow(() -> new AppException("Merchant not found", ApiError.MERCHANT_NOT_FOUND, 404));

        if (merchant.getStatus() != MerchantStatus.ACTIVE || merchant.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new AppException("Merchant is not active or approved", ApiError.INVALID_MERCHANT_STATE, 409);
        }

        // 4. Validate Offer (if supplied)
        Offer offer = null;
        if (offerId != null) {
            offer = offerRepository.findById(offerId)
                    .orElseThrow(() -> new AppException("Offer is not available for payment", ApiError.OFFER_NOT_ELIGIBLE, 409));

            if (!store.getId().equals(offer.getStoreId())) {
                throw new AppException("Offer does not belong to this store", ApiError.OFFER_NOT_ELIGIBLE, 409);
            }

            if (offer.getStatus() != OfferStatus.ACTIVE || offer.getApprovalStatus() != OfferApprovalStatus.APPROVED) {
                throw new AppException("Offer is not available for payment", ApiError.OFFER_NOT_ELIGIBLE, 409);
            }

            Instant now = Instant.now();
            if (offer.getValidFrom() != null && now.isBefore(offer.getValidFrom())) {
                throw new AppException("Offer has not started yet", ApiError.OFFER_NOT_ELIGIBLE, 409);
            }
            if (offer.getValidTo() != null && now.isAfter(offer.getValidTo())) {
                throw new AppException("Offer is expired", ApiError.OFFER_NOT_ELIGIBLE, 409);
            }
        }

        return new ValidatedEntities(customer, merchant, store, offer);
    }
}
