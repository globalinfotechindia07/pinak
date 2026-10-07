package com.superapp.transaction.payment.webhook;

import com.superapp.common.audit.AuditEventType;
import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.transaction.common.PaymentStateMachine;
import com.superapp.transaction.payment.entity.Payment;
import com.superapp.transaction.payment.entity.WebhookEventLog;
import com.superapp.transaction.payment.enums.PaymentStatus;
import com.superapp.transaction.payment.provider.PaymentProvider;
import com.superapp.transaction.payment.provider.ProviderWebhookEvent;
import com.superapp.transaction.payment.repository.PaymentRepository;
import com.superapp.transaction.payment.repository.WebhookEventRepository;
import com.superapp.transaction.transaction.entity.Transaction;
import com.superapp.transaction.transaction.enums.TransactionStatus;
import com.superapp.transaction.transaction.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.superapp.transaction.notification.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class PaymentWebhookServiceImpl implements PaymentWebhookService {

    private static final Logger log = LoggerFactory.getLogger(PaymentWebhookServiceImpl.class);

    private final List<PaymentProvider> paymentProviders;
    private final WebhookEventRepository webhookEventRepository;
    private final PaymentRepository paymentRepository;
    private final TransactionRepository transactionRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    @Autowired
    public PaymentWebhookServiceImpl(
            List<PaymentProvider> paymentProviders,
            WebhookEventRepository webhookEventRepository,
            PaymentRepository paymentRepository,
            TransactionRepository transactionRepository,
            AuditService auditService,
            @Autowired(required = false) NotificationService notificationService) {
        this.paymentProviders = paymentProviders;
        this.webhookEventRepository = webhookEventRepository;
        this.paymentRepository = paymentRepository;
        this.transactionRepository = transactionRepository;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    public PaymentWebhookServiceImpl(
            List<PaymentProvider> paymentProviders,
            WebhookEventRepository webhookEventRepository,
            PaymentRepository paymentRepository,
            TransactionRepository transactionRepository,
            AuditService auditService) {
        this(paymentProviders, webhookEventRepository, paymentRepository, transactionRepository, auditService, null);
    }

    @Override
    @Transactional
    public Map<String, Object> processWebhook(String providerName, String rawPayload, String signatureHeader, String requestId) {
        // 1. Locate provider implementation
        PaymentProvider provider = paymentProviders.stream()
                .filter(p -> p.getProviderName().equalsIgnoreCase(providerName))
                .findFirst()
                .orElseThrow(() -> new AppException("Unsupported payment provider: " + providerName,
                        ApiError.VALIDATION_FAILED, 400));

        // 2. Webhook Signature Verification
        boolean isValidSignature = provider.verifyWebhookSignature(rawPayload, signatureHeader);
        if (!isValidSignature) {
            log.warn("Invalid webhook signature for provider={}", providerName);
            auditService.record(AuditEventType.WEBHOOK_REJECTED, null, null, null, requestId,
                    "Invalid signature for provider: " + providerName);
            throw new AppException("Webhook signature verification failed",
                    ApiError.WEBHOOK_SIGNATURE_INVALID, 400);
        }

        // 3. Parse Event
        ProviderWebhookEvent event = provider.parseWebhookEvent(rawPayload);
        log.info("Webhook event received: id={} provider={} type={}", event.eventId(), providerName, event.eventType());

        // 4. Replay Protection & Webhook Event Idempotency
        if (webhookEventRepository.existsByProviderAndProviderEventId(provider.getProviderName(), event.eventId())) {
            log.info("Duplicate webhook event ignored: id={} provider={}", event.eventId(), providerName);
            return Map.of(
                    "status", "ALREADY_PROCESSED",
                    "eventId", event.eventId(),
                    "message", "Event already handled"
            );
        }

        // Persist processed event for idempotency
        WebhookEventLog eventLog = new WebhookEventLog(
                provider.getProviderName(),
                event.eventId(),
                event.eventType(),
                event.paymentId(),
                rawPayload
        );
        webhookEventRepository.save(eventLog);
        auditService.record(AuditEventType.WEBHOOK_RECEIVED, null, null, null, requestId,
                "Webhook received: " + event.eventId());

        // 5. Payment & Order Verification
        Payment payment = null;
        if (event.paymentId() != null) {
            payment = paymentRepository.findById(event.paymentId()).orElse(null);
        }
        if (payment == null && event.providerOrderId() != null) {
            payment = paymentRepository.findByProviderOrderId(event.providerOrderId()).orElse(null);
        }

        if (payment == null) {
            log.error("Payment not found for webhook event: {}", event.eventId());
            auditService.record(AuditEventType.WEBHOOK_REJECTED, null, null, null, requestId,
                    "Payment not found for event: " + event.eventId());
            throw new AppException("Payment not found", ApiError.PAYMENT_NOT_FOUND, 404);
        }

        // Verify order ID relationship
        if (event.providerOrderId() != null && !event.providerOrderId().equals(payment.getProviderOrderId())) {
            log.error("Provider order mismatch: expected={} received={}", payment.getProviderOrderId(), event.providerOrderId());
            auditService.record(AuditEventType.WEBHOOK_REJECTED, payment.getCustomerId(), null, null, requestId,
                    "Provider order mismatch for event: " + event.eventId());
            throw new AppException("Provider order mismatch", ApiError.VALIDATION_FAILED, 400);
        }

        // Verify amount
        if (event.amount() != null && payment.getPayableAmount().compareTo(event.amount()) != 0) {
            log.error("Amount mismatch for payment {}: expected={} received={}",
                    payment.getId(), payment.getPayableAmount(), event.amount());
            auditService.record(AuditEventType.WEBHOOK_REJECTED, payment.getCustomerId(), null, null, requestId,
                    "Amount mismatch for payment: " + payment.getId());
            throw new AppException("Payment amount mismatch", ApiError.VALIDATION_FAILED, 400);
        }

        // Verify currency
        if (event.currency() != null && !payment.getCurrency().equalsIgnoreCase(event.currency())) {
            log.error("Currency mismatch for payment {}: expected={} received={}",
                    payment.getId(), payment.getCurrency(), event.currency());
            auditService.record(AuditEventType.WEBHOOK_REJECTED, payment.getCustomerId(), null, null, requestId,
                    "Currency mismatch for payment: " + payment.getId());
            throw new AppException("Currency mismatch", ApiError.INVALID_CURRENCY, 400);
        }

        auditService.record(AuditEventType.WEBHOOK_VERIFIED, payment.getCustomerId(), null, null, requestId,
                "Webhook verified for payment: " + payment.getId());

        // 6. State Machine Transitions
        final Payment verifiedPayment = payment;
        final String providerPaymentMethod = payment.getProvider();
        Optional<Transaction> txOpt = payment.getTransactionId() != null ?
                transactionRepository.findById(payment.getTransactionId()) : Optional.empty();

        if (event.status() == PaymentStatus.SUCCESS) {
            if (verifiedPayment.getStatus() == PaymentStatus.SUCCESS) {
                log.info("Payment {} already marked SUCCESS", verifiedPayment.getId());
                return Map.of("status", "SUCCESS", "paymentId", verifiedPayment.getId());
            }

            PaymentStateMachine.validateTransition(verifiedPayment.getStatus(), PaymentStatus.SUCCESS);
            verifiedPayment.setStatus(PaymentStatus.SUCCESS);
            verifiedPayment.setProviderPaymentId(event.providerPaymentId());
            verifiedPayment.setPaidAt(Instant.now());
            paymentRepository.save(verifiedPayment);

            txOpt.ifPresent(tx -> {
                tx.setStatus(TransactionStatus.SUCCESS);
                if (event.providerPaymentId() != null) {
                    tx.setProviderTransactionId(event.providerPaymentId());
                }
                if (providerPaymentMethod != null) {
                    tx.setPaymentMethod(providerPaymentMethod);
                }
                transactionRepository.save(tx);
            });

            auditService.record(AuditEventType.PAYMENT_SUCCESS, verifiedPayment.getCustomerId(), null, null, requestId,
                    "Payment confirmed: " + verifiedPayment.getId());

            if (notificationService != null) {
                try {
                    notificationService.createPaymentNotification(verifiedPayment);
                } catch (Exception ex) {
                    log.warn("Failed to create payment success notification: {}", ex.getMessage());
                }
            }

        } else if (event.status() == PaymentStatus.FAILED) {
            if (verifiedPayment.getStatus() == PaymentStatus.FAILED) {
                return Map.of("status", "FAILED", "paymentId", verifiedPayment.getId());
            }

            PaymentStateMachine.validateTransition(verifiedPayment.getStatus(), PaymentStatus.FAILED);
            verifiedPayment.setStatus(PaymentStatus.FAILED);
            verifiedPayment.setFailureCode(event.failureCode());
            verifiedPayment.setFailureReason(event.failureReason());
            paymentRepository.save(verifiedPayment);

            txOpt.ifPresent(tx -> {
                tx.setStatus(TransactionStatus.FAILED);
                if (providerPaymentMethod != null) {
                    tx.setPaymentMethod(providerPaymentMethod);
                }
                transactionRepository.save(tx);
            });

            auditService.record(AuditEventType.PAYMENT_FAILED, verifiedPayment.getCustomerId(), null, null, requestId,
                    "Payment failed: " + verifiedPayment.getId() + " code=" + event.failureCode());

            if (notificationService != null) {
                try {
                    notificationService.createPaymentNotification(verifiedPayment);
                } catch (Exception ex) {
                    log.warn("Failed to create payment failure notification: {}", ex.getMessage());
                }
            }

        } else if (event.status() == PaymentStatus.REFUNDED) {
            PaymentStateMachine.validateTransition(verifiedPayment.getStatus(), PaymentStatus.REFUNDED);
            verifiedPayment.setStatus(PaymentStatus.REFUNDED);
            paymentRepository.save(verifiedPayment);

            txOpt.ifPresent(tx -> {
                tx.setStatus(TransactionStatus.REFUNDED);
                transactionRepository.save(tx);
            });

            auditService.record(AuditEventType.PAYMENT_REFUNDED, verifiedPayment.getCustomerId(), null, null, requestId,
                    "Payment refunded: " + verifiedPayment.getId());
        }

        return Map.of(
                "status", verifiedPayment.getStatus().name(),
                "paymentId", verifiedPayment.getId(),
                "eventId", event.eventId()
        );
    }
}
