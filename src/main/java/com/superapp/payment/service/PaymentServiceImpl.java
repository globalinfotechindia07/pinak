package com.superapp.payment.service;

import com.superapp.common.exception.AppException;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.common.response.ApiError;
import com.superapp.payment.dto.InitiatePaymentRequest;
import com.superapp.payment.dto.PaymentResponse;
import com.superapp.payment.dto.PaymentWebhookRequest;
import com.superapp.payment.dto.RefundPaymentRequest;
import com.superapp.payment.entity.Payment;
import com.superapp.payment.entity.PaymentStatus;
import com.superapp.payment.mapper.PaymentMapper;
import com.superapp.payment.repository.PaymentRepository;
import com.superapp.payment.service.gateway.PaymentGatewayProvider;
import com.superapp.reward.dto.EarnRewardRequest;
import com.superapp.reward.service.RewardService;
import com.superapp.transactionhistory.entity.TransactionStatus;
import com.superapp.transactionhistory.entity.TransactionType;
import com.superapp.transactionhistory.service.TransactionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class PaymentServiceImpl implements PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);

    private final PaymentRepository paymentRepository;
    private final PaymentGatewayProvider paymentGatewayProvider;
    private final PaymentMapper paymentMapper;
    private final TransactionService transactionService;
    private final RewardService rewardService;

    public PaymentServiceImpl(
            PaymentRepository paymentRepository,
            PaymentGatewayProvider paymentGatewayProvider,
            PaymentMapper paymentMapper,
            TransactionService transactionService,
            RewardService rewardService
    ) {
        this.paymentRepository = paymentRepository;
        this.paymentGatewayProvider = paymentGatewayProvider;
        this.paymentMapper = paymentMapper;
        this.transactionService = transactionService;
        this.rewardService = rewardService;
    }

    @Override
    @Transactional
    public PaymentResponse initiatePayment(InitiatePaymentRequest request, UUID customerId) {
        String paymentReference = "PAY_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
        log.info("Initiating payment ref={} for customerId={} amount={}", paymentReference, customerId, request.amount());

        Payment payment = new Payment(
                paymentReference,
                customerId,
                request.merchantId(),
                request.storeId(),
                request.offerId(),
                request.amount(),
                request.currency(),
                request.paymentMethod(),
                request.notes()
        );
        payment.setStatus(PaymentStatus.INITIATED);

        Payment savedPayment = paymentRepository.save(payment);

        // Prepares payment intent with UPI provider abstraction
        PaymentGatewayProvider.PaymentGatewayOrder order = paymentGatewayProvider.createPaymentIntent(savedPayment);
        savedPayment.setGatewayTransactionId(order.gatewayOrderId());
        savedPayment.setStatus(PaymentStatus.PENDING);
        savedPayment = paymentRepository.save(savedPayment);

        return paymentMapper.toResponse(savedPayment, order.upiIntentUrl(), order.qrCodeData());
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(UUID id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));
        return paymentMapper.toResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByReference(String reference) {
        Payment payment = paymentRepository.findByPaymentReference(reference)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with reference: " + reference));
        return paymentMapper.toResponse(payment);
    }

    @Override
    @Transactional
    public PaymentResponse processWebhook(PaymentWebhookRequest request) {
        log.info("Processing payment webhook for reference={}, status={}",
                request.paymentReference(), request.status());

        if (!paymentGatewayProvider.verifyWebhookSignature(request.paymentReference(), request.signature())) {
            log.warn("Webhook signature verification failed for ref={}", request.paymentReference());
            throw new AppException("Invalid webhook signature", ApiError.UNAUTHORIZED, 401);
        }

        Payment payment = paymentRepository.findByPaymentReference(request.paymentReference())
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with reference: " + request.paymentReference()));

        if (payment.getStatus() == PaymentStatus.SUCCESS && request.status() == PaymentStatus.SUCCESS) {
            log.info("Payment {} already marked SUCCESS, skipping redundant webhook", payment.getPaymentReference());
            return paymentMapper.toResponse(payment);
        }

        payment.setStatus(request.status());
        if (request.gatewayTransactionId() != null) {
            payment.setGatewayTransactionId(request.gatewayTransactionId());
        }
        if (request.failureReason() != null) {
            payment.setFailureReason(request.failureReason());
        }

        Payment savedPayment = paymentRepository.save(payment);

        if (request.status() == PaymentStatus.SUCCESS) {
            // 1. Record in Transaction History
            transactionService.recordTransaction(
                    savedPayment.getPaymentReference(),
                    savedPayment.getId(),
                    savedPayment.getCustomerId(),
                    savedPayment.getMerchantId(),
                    savedPayment.getStoreId(),
                    savedPayment.getAmount(),
                    savedPayment.getCurrency(),
                    TransactionType.PAYMENT,
                    TransactionStatus.SUCCESS,
                    "Payment confirmed for ref: " + savedPayment.getPaymentReference()
            );

            // 2. Award reward points (e.g. 5% cashback: 1 point per 20 currency units)
            long pointsToEarn = Math.max(1L, savedPayment.getAmount().divideToIntegralValue(BigDecimal.valueOf(20)).longValue());
            rewardService.earnPoints(new EarnRewardRequest(
                    savedPayment.getCustomerId(),
                    pointsToEarn,
                    "PAYMENT",
                    savedPayment.getPaymentReference(),
                    "Cashback points for payment " + savedPayment.getPaymentReference()
            ));

            log.info("Payment {} completed successfully. Awarded {} reward points.",
                    savedPayment.getPaymentReference(), pointsToEarn);
        } else if (request.status() == PaymentStatus.FAILED) {
            transactionService.recordTransaction(
                    savedPayment.getPaymentReference(),
                    savedPayment.getId(),
                    savedPayment.getCustomerId(),
                    savedPayment.getMerchantId(),
                    savedPayment.getStoreId(),
                    savedPayment.getAmount(),
                    savedPayment.getCurrency(),
                    TransactionType.PAYMENT,
                    TransactionStatus.FAILED,
                    "Payment failed: " + savedPayment.getFailureReason()
            );
        }

        return paymentMapper.toResponse(savedPayment);
    }

    @Override
    @Transactional
    public PaymentResponse refundPayment(UUID paymentId, RefundPaymentRequest request) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            throw new AppException("Only SUCCESS payments can be refunded. Current status: " + payment.getStatus(),
                    ApiError.VALIDATION_FAILED, 400);
        }

        boolean refundSuccess = paymentGatewayProvider.processRefund(payment, request.amount(), request.reason());
        if (!refundSuccess) {
            throw new AppException("Gateway rejected the refund request", ApiError.INTERNAL_SERVER_ERROR, 502);
        }

        payment.setStatus(PaymentStatus.REFUNDED);
        Payment saved = paymentRepository.save(payment);

        // Record refund in Transaction History
        transactionService.recordTransaction(
                "REF_" + saved.getPaymentReference(),
                saved.getId(),
                saved.getCustomerId(),
                saved.getMerchantId(),
                saved.getStoreId(),
                request.amount(),
                saved.getCurrency(),
                TransactionType.REFUND,
                TransactionStatus.SUCCESS,
                "Refund processed: " + request.reason()
        );

        log.info("Refund processed for payment id={} amount={}", paymentId, request.amount());
        return paymentMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentResponse> getCustomerPayments(UUID customerId, Pageable pageable) {
        return paymentRepository.findByCustomerId(customerId, pageable)
                .map(paymentMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentResponse> getMerchantPayments(UUID merchantId, Pageable pageable) {
        return paymentRepository.findByMerchantId(merchantId, pageable)
                .map(paymentMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public com.superapp.payment.dto.PaymentStatusResponse getPaymentStatus(UUID id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));
        return com.superapp.payment.dto.PaymentStatusResponse.fromEntity(payment);
    }
}
