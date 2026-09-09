package com.superapp.redemption.service;

import com.superapp.common.exception.AppException;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.common.response.ApiError;
import com.superapp.redemption.dto.CreateRedemptionRequest;
import com.superapp.redemption.dto.RedemptionResponse;
import com.superapp.redemption.entity.OfferRedemption;
import com.superapp.redemption.entity.RedemptionStatus;
import com.superapp.redemption.repository.OfferRedemptionRepository;
import com.superapp.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
public class RedemptionServiceImpl implements RedemptionService {

    private static final Logger log = LoggerFactory.getLogger(RedemptionServiceImpl.class);

    private final OfferRedemptionRepository redemptionRepository;
    private final UserRepository userRepository;

    public RedemptionServiceImpl(OfferRedemptionRepository redemptionRepository, UserRepository userRepository) {
        this.redemptionRepository = redemptionRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public RedemptionResponse createRedemption(CreateRedemptionRequest request, UUID customerId) {
        if (!userRepository.existsById(customerId)) {
            throw new ResourceNotFoundException("Customer", "id", customerId);
        }

        BigDecimal bill = request.billAmount();
        BigDecimal discountPct = request.discountPercentage() != null ? request.discountPercentage() : BigDecimal.valueOf(10.0);

        // Calculate discount amount: bill * (discountPct / 100)
        BigDecimal discountAmount = bill.multiply(discountPct)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        // Cap discount at bill amount
        if (discountAmount.compareTo(bill) > 0) {
            discountAmount = bill;
        }

        BigDecimal payableAmount = bill.subtract(discountAmount).setScale(2, RoundingMode.HALF_UP);

        OfferRedemption redemption = new OfferRedemption(
                request.offerId(),
                customerId,
                request.storeId(),
                bill,
                discountAmount,
                payableAmount,
                null // payment will be linked upon payment initiation / webhook
        );

        OfferRedemption saved = redemptionRepository.save(redemption);
        log.info("Created offer redemption id={} for customerId={} bill={} discount={} payable={}",
                saved.getId(), customerId, bill, discountAmount, payableAmount);

        return RedemptionResponse.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public RedemptionResponse getRedemptionById(UUID id, UUID currentUserId, boolean isAdmin) {
        OfferRedemption redemption = redemptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Redemption", "id", id));

        if (!isAdmin && !redemption.getCustomerId().equals(currentUserId)) {
            throw new AppException("You are not authorized to view this redemption", ApiError.FORBIDDEN, 403);
        }

        return RedemptionResponse.fromEntity(redemption);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RedemptionResponse> getAllRedemptions(Pageable pageable) {
        return redemptionRepository.findAll(pageable)
                .map(RedemptionResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RedemptionResponse> getCustomerRedemptions(UUID customerId, Pageable pageable) {
        return redemptionRepository.findByCustomerId(customerId, pageable)
                .map(RedemptionResponse::fromEntity);
    }

    @Override
    @Transactional
    public RedemptionResponse completeRedemption(UUID redemptionId, UUID paymentId) {
        OfferRedemption redemption = redemptionRepository.findById(redemptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Redemption", "id", redemptionId));

        redemption.setPaymentId(paymentId);
        redemption.setStatus(RedemptionStatus.COMPLETED);
        OfferRedemption saved = redemptionRepository.save(redemption);

        log.info("Completed redemption id={} with paymentId={}", redemptionId, paymentId);
        return RedemptionResponse.fromEntity(saved);
    }
}
