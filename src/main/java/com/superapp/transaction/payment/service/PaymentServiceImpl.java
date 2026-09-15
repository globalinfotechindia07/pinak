package com.superapp.transaction.payment.service;

import com.superapp.common.audit.AuditEventType;
import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.transaction.common.AmountCalculator;
import com.superapp.transaction.common.PaymentStateMachine;
import com.superapp.transaction.payment.dto.CreatePaymentRequest;
import com.superapp.transaction.payment.dto.PaymentCancelResponse;
import com.superapp.transaction.payment.dto.PaymentIntentDto;
import com.superapp.transaction.payment.dto.PaymentResponse;
import com.superapp.transaction.payment.entity.Payment;
import com.superapp.transaction.payment.enums.PaymentStatus;
import com.superapp.transaction.payment.mapper.PaymentMapper;
import com.superapp.transaction.payment.provider.PaymentProvider;
import com.superapp.transaction.payment.provider.ProviderOrderResponse;
import com.superapp.transaction.payment.repository.PaymentRepository;
import com.superapp.transaction.payment.validation.PaymentValidator;
import com.superapp.transaction.transaction.entity.Transaction;
import com.superapp.transaction.transaction.enums.TransactionStatus;
import com.superapp.transaction.transaction.enums.TransactionType;
import com.superapp.transaction.transaction.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
public class PaymentServiceImpl implements PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);

    private final PaymentRepository paymentRepository;
    private final TransactionRepository transactionRepository;
    private final PaymentValidator paymentValidator;
    private final PaymentMapper paymentMapper;
    private final PaymentProvider paymentProvider;
    private final AuditService auditService;

    public PaymentServiceImpl(
            PaymentRepository paymentRepository,
            TransactionRepository transactionRepository,
            PaymentValidator paymentValidator,
            PaymentMapper paymentMapper,
            PaymentProvider paymentProvider,
            AuditService auditService) {
        this.paymentRepository = paymentRepository;
        this.transactionRepository = transactionRepository;
        this.paymentValidator = paymentValidator;
        this.paymentMapper = paymentMapper;
        this.paymentProvider = paymentProvider;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    public PaymentResponse initiatePayment(CreatePaymentRequest request, UUID customerId, String idempotencyKey, String requestId) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new AppException("Idempotency-Key header is mandatory for payment creation",
                    ApiError.VALIDATION_FAILED, 400);
        }

        AmountCalculator.validateCurrency(request.currency());

        // 1. Idempotency Check: Customer + IdempotencyKey
        Optional<Payment> existingOpt = paymentRepository.findByCustomerIdAndIdempotencyKey(customerId, idempotencyKey.trim());
        if (existingOpt.isPresent()) {
            Payment existing = existingOpt.get();
            boolean matches = Objects.equals(existing.getStoreId(), request.storeId()) &&
                    Objects.equals(existing.getOfferId(), request.offerId()) &&
                    existing.getGrossAmount().compareTo(request.grossAmount()) == 0;

            if (matches) {
                log.info("Idempotent payment replay for customer={} key={}", customerId, idempotencyKey);
                return paymentMapper.toResponse(existing);
            } else {
                log.warn("Idempotency conflict for customer={} key={}", customerId, idempotencyKey);
                throw new AppException("Payment request has already been processed",
                        ApiError.IDEMPOTENCY_CONFLICT, 409);
            }
        }

        // 2. Validate Entities (Customer, Store, Merchant, Offer)
        PaymentValidator.ValidatedEntities entities = paymentValidator.validatePaymentInitiation(
                customerId, request.storeId(), request.offerId());

        // 3. Backend-authoritative amount calculations
        AmountCalculator.CalculationResult calc = AmountCalculator.calculate(request.grossAmount(), entities.offer());

        // 4. Create internal ledger Transaction
        Transaction transaction = new Transaction();
        transaction.setCustomerId(customerId);
        transaction.setMerchantId(entities.merchant().getId());
        transaction.setStoreId(entities.store().getId());
        transaction.setOfferId(entities.offer() != null ? entities.offer().getId() : null);
        transaction.setGrossAmount(calc.grossAmount());
        transaction.setDiscountAmount(calc.discountAmount());
        transaction.setPayableAmount(calc.payableAmount());
        transaction.setAmount(calc.payableAmount());
        transaction.setCurrency(AmountCalculator.SUPPORTED_CURRENCY);
        transaction.setType(TransactionType.PAYMENT);
        transaction.setStatus(TransactionStatus.PENDING);
        transaction = transactionRepository.save(transaction);

        // 5. Create Payment record
        Payment payment = new Payment();
        payment.setCustomerId(customerId);
        payment.setMerchantId(entities.merchant().getId());
        payment.setStoreId(entities.store().getId());
        payment.setOfferId(entities.offer() != null ? entities.offer().getId() : null);
        payment.setTransactionId(transaction.getId());
        payment.setGrossAmount(calc.grossAmount());
        payment.setDiscountAmount(calc.discountAmount());
        payment.setPayableAmount(calc.payableAmount());
        payment.setAmount(calc.payableAmount());
        payment.setCurrency(AmountCalculator.SUPPORTED_CURRENCY);
        payment.setIdempotencyKey(idempotencyKey.trim());
        payment.setStatus(PaymentStatus.INITIATED);

        try {
            payment = paymentRepository.saveAndFlush(payment);
        } catch (DataIntegrityViolationException ex) {
            // Concurrent race condition handler for unique constraint (customer_id, idempotency_key)
            log.warn("Concurrent duplicate payment insert detected for customer={} key={}", customerId, idempotencyKey);
            Optional<Payment> raceOpt = paymentRepository.findByCustomerIdAndIdempotencyKey(customerId, idempotencyKey.trim());
            if (raceOpt.isPresent()) {
                Payment racePayment = raceOpt.get();
                if (Objects.equals(racePayment.getStoreId(), request.storeId()) &&
                        Objects.equals(racePayment.getOfferId(), request.offerId()) &&
                        racePayment.getGrossAmount().compareTo(request.grossAmount()) == 0) {
                    return paymentMapper.toResponse(racePayment);
                }
            }
            throw new AppException("Payment request has already been processed",
                    ApiError.IDEMPOTENCY_CONFLICT, 409);
        }

        // 6. Request Provider Intent
        ProviderOrderResponse providerOrder;
        try {
            providerOrder = paymentProvider.createOrder(payment);
        } catch (Exception ex) {
            log.error("Provider order creation failed for payment {}: {}", payment.getId(), ex.getMessage());
            // Safe failure: leave payment PENDING or FAILED with reason
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason("Provider error: " + ex.getMessage());
            paymentRepository.save(payment);
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new AppException("Payment provider temporarily unavailable",
                    ApiError.PAYMENT_PROVIDER_ERROR, 502);
        }

        // 7. Update Payment with provider order details & transition to PENDING
        payment.setProvider(providerOrder.provider());
        payment.setProviderOrderId(providerOrder.providerOrderId());
        payment.setExpiresAt(providerOrder.expiresAt());
        PaymentStateMachine.validateTransition(payment.getStatus(), PaymentStatus.PENDING);
        payment.setStatus(PaymentStatus.PENDING);
        payment = paymentRepository.save(payment);

        // Associate paymentId on transaction
        transaction.setPaymentId(payment.getId());
        transactionRepository.save(transaction);

        // 8. Audit Logging
        auditService.record(AuditEventType.PAYMENT_INITIATED, customerId, null, null, requestId,
                "Payment initiated: " + payment.getId());
        auditService.record(AuditEventType.PAYMENT_PENDING, customerId, null, null, requestId,
                "Provider order: " + providerOrder.providerOrderId());

        PaymentIntentDto intentDto = new PaymentIntentDto(
                providerOrder.intentType().name(),
                providerOrder.intentValue()
        );

        return paymentMapper.toResponse(payment, intentDto);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(UUID paymentId, UUID authenticatedUserId, boolean isAdmin) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new AppException("Payment not found", ApiError.PAYMENT_NOT_FOUND, 404));

        if (!isAdmin && !payment.getCustomerId().equals(authenticatedUserId)) {
            throw new AppException("You do not have permission to access this payment",
                    ApiError.PAYMENT_ACCESS_DENIED, 403);
        }

        return paymentMapper.toResponse(payment);
    }

    @Override
    @Transactional
    public PaymentCancelResponse cancelPayment(UUID paymentId, UUID authenticatedUserId, boolean isAdmin) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new AppException("Payment not found", ApiError.PAYMENT_NOT_FOUND, 404));

        if (!isAdmin && !payment.getCustomerId().equals(authenticatedUserId)) {
            throw new AppException("You do not have permission to access this payment",
                    ApiError.PAYMENT_ACCESS_DENIED, 403);
        }

        if (!PaymentStateMachine.isCancellable(payment.getStatus())) {
            throw new AppException("Payment cannot be cancelled in status: " + payment.getStatus(),
                    ApiError.INVALID_PAYMENT_STATE, 409);
        }

        PaymentStateMachine.validateTransition(payment.getStatus(), PaymentStatus.CANCELLED);
        payment.setStatus(PaymentStatus.CANCELLED);
        payment = paymentRepository.save(payment);

        if (payment.getTransactionId() != null) {
            transactionRepository.findById(payment.getTransactionId()).ifPresent(tx -> {
                tx.setStatus(TransactionStatus.CANCELLED);
                transactionRepository.save(tx);
            });
        }

        auditService.record(AuditEventType.PAYMENT_CANCELLED, authenticatedUserId, null, null, null,
                "Payment cancelled: " + paymentId);

        return new PaymentCancelResponse(
                payment.getId(),
                payment.getTransactionId(),
                payment.getStatus(),
                Instant.now()
        );
    }
}
