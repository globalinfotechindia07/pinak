package com.superapp.transaction.redemption.validation;

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
import com.superapp.transaction.payment.entity.Payment;
import com.superapp.transaction.payment.enums.PaymentStatus;
import com.superapp.transaction.payment.repository.PaymentRepository;
import com.superapp.transaction.redemption.entity.Redemption;
import com.superapp.transaction.redemption.enums.RedemptionStatus;
import com.superapp.transaction.redemption.repository.RedemptionRepository;
import com.superapp.transaction.transaction.entity.Transaction;
import com.superapp.transaction.transaction.repository.TransactionRepository;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Component
public class RedemptionValidator {

    private final PaymentRepository paymentRepository;
    private final TransactionRepository transactionRepository;
    private final OfferRepository offerRepository;
    private final StoreRepository storeRepository;
    private final MerchantRepository merchantRepository;
    private final RedemptionRepository redemptionRepository;

    public RedemptionValidator(
            PaymentRepository paymentRepository,
            TransactionRepository transactionRepository,
            OfferRepository offerRepository,
            StoreRepository storeRepository,
            MerchantRepository merchantRepository,
            RedemptionRepository redemptionRepository) {
        this.paymentRepository = paymentRepository;
        this.transactionRepository = transactionRepository;
        this.offerRepository = offerRepository;
        this.storeRepository = storeRepository;
        this.merchantRepository = merchantRepository;
        this.redemptionRepository = redemptionRepository;
    }

    public record ValidatedRedemption(
            Payment payment,
            Transaction transaction,
            Offer offer,
            Store store,
            Merchant merchant
    ) {}

    public ValidatedRedemption validateRedemption(UUID customerId, UUID paymentId, UUID offerId) {
        // 1. Check if already redeemed
        Optional<Redemption> existingRedemption = redemptionRepository.findByPaymentIdAndOfferId(paymentId, offerId);
        if (existingRedemption.isPresent() && existingRedemption.get().getStatus() == RedemptionStatus.SUCCESS) {
            throw new AppException("Offer has already been redeemed", ApiError.OFFER_ALREADY_REDEEMED, 409);
        }

        // 2. Find Payment
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new AppException("Payment not found", ApiError.PAYMENT_NOT_FOUND, 404));

        // 3. Verify Payment Ownership
        if (!payment.getCustomerId().equals(customerId)) {
            throw new AppException("You are not authorized to redeem this payment", ApiError.PAYMENT_ACCESS_DENIED, 403);
        }

        // 4. Verify Payment Status is SUCCESS
        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            throw new AppException("Payment has not been successfully completed", ApiError.PAYMENT_NOT_SUCCESSFUL, 409);
        }

        // 5. Verify Payment matches Offer
        if (payment.getOfferId() == null || !payment.getOfferId().equals(offerId)) {
            throw new AppException("Payment is not associated with this offer", ApiError.OFFER_NOT_ELIGIBLE, 400);
        }

        // 6. Find Offer with lock
        Offer offer = offerRepository.findByIdForUpdate(offerId)
                .orElseThrow(() -> new AppException("Offer not found", ApiError.OFFER_NOT_FOUND, 404));

        // 7. Verify Offer validity
        if (offer.getStatus() != OfferStatus.ACTIVE || offer.getApprovalStatus() != OfferApprovalStatus.APPROVED) {
            throw new AppException("Offer is not active or approved", ApiError.OFFER_NOT_ELIGIBLE, 409);
        }

        Instant now = Instant.now();
        if (now.isAfter(offer.getValidTo())) {
            throw new AppException("Offer has expired", ApiError.OFFER_EXPIRED, 409);
        }
        if (now.isBefore(offer.getValidFrom())) {
            throw new AppException("Offer is not yet valid", ApiError.OFFER_NOT_ELIGIBLE, 409);
        }

        // 8. Find Store & Merchant
        Store store = storeRepository.findById(payment.getStoreId())
                .orElseThrow(() -> new AppException("Store not found", ApiError.STORE_NOT_FOUND, 404));

        if (store.getStatus() != StoreStatus.ACTIVE || store.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new AppException("Store is not active or approved", ApiError.INVALID_STORE_STATE, 400);
        }

        Merchant merchant = merchantRepository.findById(payment.getMerchantId())
                .orElseThrow(() -> new AppException("Merchant not found", ApiError.MERCHANT_NOT_FOUND, 404));

        if (merchant.getStatus() != MerchantStatus.ACTIVE || merchant.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new AppException("Merchant is not active or approved", ApiError.INVALID_MERCHANT_STATE, 400);
        }

        // 9. Verify Store and Offer relationship
        if (offer.getStoreId() != null && !offer.getStoreId().equals(store.getId())) {
            throw new AppException("Offer is not valid for this store", ApiError.STORE_NOT_ELIGIBLE, 400);
        }
        if (!store.getMerchantId().equals(merchant.getId())) {
            throw new AppException("Store does not belong to the payment merchant", ApiError.MERCHANT_ACCESS_DENIED, 400);
        }

        // 10. Check Customer Usage Limit
        if (offer.getPerCustomerLimit() != null && offer.getPerCustomerLimit() > 0) {
            long customerUsage = redemptionRepository.countByCustomerIdAndOfferIdAndStatus(
                    customerId, offer.getId(), RedemptionStatus.SUCCESS);
            if (customerUsage >= offer.getPerCustomerLimit()) {
                throw new AppException("Offer usage limit reached for this customer", ApiError.CUSTOMER_OFFER_LIMIT_REACHED, 409);
            }
        }

        // 11. Check Global Usage Limit
        if (offer.getUsageLimit() != null && offer.getUsageLimit() > 0) {
            if (offer.getCurrentUsageCount() >= offer.getUsageLimit()) {
                throw new AppException("Offer usage limit has been reached", ApiError.OFFER_USAGE_LIMIT_REACHED, 409);
            }
        }

        // 12. Find Transaction
        Transaction transaction = null;
        if (payment.getTransactionId() != null) {
            transaction = transactionRepository.findById(payment.getTransactionId()).orElse(null);
        }
        if (transaction == null) {
            transaction = transactionRepository.findByPaymentId(payment.getId()).orElse(null);
        }

        return new ValidatedRedemption(payment, transaction, offer, store, merchant);
    }
}
