package com.superapp.user.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Data Transfer Objects for Admin Customer Directory & Management Subsystem.
 */
public class CustomerDtos {

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record CustomerDirectoryResponse(
            UUID id,
            String name,
            String firstName,
            String lastName,
            String phone,
            String email,
            String city,
            String primaryCity,
            String state,
            String district,
            String pincode,
            String address,
            String gender,
            LocalDate birthday,
            String referralCode,
            String referredByCode,
            boolean profileCompleted,
            String status,
            long visits,
            BigDecimal totalSpend,
            int rewardsBalance,
            String tier,
            String segment,
            Instant createdAt,
            Instant lastActive,
            String initials
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record CustomerStatsResponse(
            long totalCustomers,
            long activeCustomers,
            long suspendedCustomers,
            long powerUsers,
            BigDecimal totalPlatformSpend,
            long totalCoinsCirculating,
            BigDecimal avgSpendPerCustomer
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record CustomerRewardSummary(
            UUID customerId,
            int pointsBalance,
            int lifetimeEarned,
            int lifetimeRedeemed,
            String tier,
            BigDecimal cashEquivalentInr,
            double multiplier,
            String status
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record CustomerTransactionSummary(
            UUID id,
            String transactionReference,
            String storeName,
            BigDecimal amount,
            BigDecimal discountAmount,
            BigDecimal payableAmount,
            int pointsAwarded,
            String paymentMethod,
            String status,
            Instant createdAt
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record CustomerBookingSummary(
            UUID id,
            String bookingRef,
            String storeName,
            LocalDate bookingDate,
            String slotTime,
            int guests,
            BigDecimal totalPaid,
            BigDecimal billAmount,
            int coinsEarned,
            String verificationCode,
            String status,
            Instant createdAt
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record CustomerRedemptionSummary(
            UUID id,
            String voucherCode,
            String offerTitle,
            String storeName,
            BigDecimal discountAmount,
            BigDecimal finalAmount,
            String status,
            Instant createdAt
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record CustomerDetailResponse(
            CustomerDirectoryResponse profile,
            CustomerRewardSummary rewardWallet,
            List<CustomerTransactionSummary> recentTransactions,
            List<CustomerBookingSummary> recentBookings,
            List<CustomerRedemptionSummary> recentRedemptions
    ) {}

    public record CreateCustomerRequest(
            @NotBlank(message = "Customer name is required")
            String name,

            @NotBlank(message = "Phone number is required")
            String phone,

            @Email(message = "Invalid email address format")
            String email,

            String city,
            String state,
            String district,
            String pincode,
            String address,
            String gender,
            String birthday,
            String referralCode,
            Integer initialBonusCoins
    ) {}

    public record UpdateCustomerStatusRequest(
            @NotBlank(message = "Status is required (ACTIVE or SUSPENDED)")
            String status,

            String reason
    ) {}

    public record AdjustCustomerPointsRequest(
            int pointsDelta,
            String reason
    ) {}
}
