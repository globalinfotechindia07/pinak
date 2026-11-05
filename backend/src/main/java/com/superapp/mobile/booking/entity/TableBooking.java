package com.superapp.mobile.booking.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * TableBooking represents a customer's pre-booked table reservation at a merchant store.
 * Tracks party size, meal slot, cover charges, VIP membership upsells, and redemption status.
 */
@Entity
@Table(name = "table_bookings")
public class TableBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "booking_ref", unique = true, nullable = false, length = 64)
    private String bookingRef;

    @Column(name = "store_id", nullable = false)
    private UUID storeId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "customer_name", nullable = false, length = 150)
    private String customerName;

    @Column(name = "customer_phone", nullable = false, length = 20)
    private String customerPhone;

    @Column(name = "customer_email", length = 150)
    private String customerEmail;

    @Column(name = "guests", nullable = false)
    private Integer guests = 2;

    @Column(name = "booking_date", nullable = false)
    private LocalDate bookingDate;

    @Column(name = "meal_type", nullable = false, length = 20)
    private String mealType; // 'LUNCH' or 'DINNER'

    @Column(name = "slot_time", nullable = false, length = 20)
    private String slotTime; // e.g. '01:45 PM'

    @Column(name = "offer_id", length = 64)
    private String offerId;

    @Column(name = "offer_title", length = 255)
    private String offerTitle;

    @Column(name = "discount_pct", precision = 5, scale = 2)
    private BigDecimal discountPct = BigDecimal.ZERO;

    @Column(name = "cover_charge_per_guest", precision = 10, scale = 2)
    private BigDecimal coverChargePerGuest = BigDecimal.ZERO;

    @Column(name = "total_cover_charge", precision = 10, scale = 2)
    private BigDecimal totalCoverCharge = BigDecimal.ZERO;

    @Column(name = "include_vip_plan")
    private Boolean includeVipPlan = false;

    @Column(name = "vip_plan_fee", precision = 10, scale = 2)
    private BigDecimal vipPlanFee = BigDecimal.ZERO;

    @Column(name = "total_paid", precision = 10, scale = 2)
    private BigDecimal totalPaid = BigDecimal.ZERO;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod = "Google Pay";

    @Column(name = "payment_status", length = 30)
    private String paymentStatus = "PAID";

    @Column(name = "status", nullable = false, length = 30)
    private String status = "CONFIRMED"; // 'CONFIRMED', 'CANCELLED', 'SEATED', 'COMPLETED', 'NO_SHOW'

    @Column(name = "verification_code", length = 10)
    private String verificationCode;

    @Column(name = "special_requests", columnDefinition = "TEXT")
    private String specialRequests;

    @Column(name = "cancellation_reason", length = 255)
    private String cancellationReason;

    @Column(name = "cancellation_comments", columnDefinition = "TEXT")
    private String cancellationComments;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "refund_amount", precision = 10, scale = 2)
    private BigDecimal refundAmount = BigDecimal.ZERO;

    @Column(name = "refund_status", length = 30)
    private String refundStatus; // 'NOT_APPLICABLE', 'INITIATED', 'REFUNDED'

    @Column(name = "refund_ref", length = 64)
    private String refundRef;

    @Column(name = "coins_earned")
    private Integer coinsEarned = 0;

    @Column(name = "bill_amount", precision = 10, scale = 2)
    private BigDecimal billAmount;

    @Column(name = "bill_added_at")
    private Instant billAddedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public TableBooking() {
    }

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (status == null) {
            status = "CONFIRMED";
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }

    // --- Getters and Setters ---

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getBookingRef() {
        return bookingRef;
    }

    public void setBookingRef(String bookingRef) {
        this.bookingRef = bookingRef;
    }

    public UUID getStoreId() {
        return storeId;
    }

    public void setStoreId(UUID storeId) {
        this.storeId = storeId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public Integer getGuests() {
        return guests;
    }

    public void setGuests(Integer guests) {
        this.guests = guests;
    }

    public LocalDate getBookingDate() {
        return bookingDate;
    }

    public void setBookingDate(LocalDate bookingDate) {
        this.bookingDate = bookingDate;
    }

    public String getMealType() {
        return mealType;
    }

    public void setMealType(String mealType) {
        this.mealType = mealType;
    }

    public String getSlotTime() {
        return slotTime;
    }

    public void setSlotTime(String slotTime) {
        this.slotTime = slotTime;
    }

    public String getOfferId() {
        return offerId;
    }

    public void setOfferId(String offerId) {
        this.offerId = offerId;
    }

    public String getOfferTitle() {
        return offerTitle;
    }

    public void setOfferTitle(String offerTitle) {
        this.offerTitle = offerTitle;
    }

    public BigDecimal getDiscountPct() {
        return discountPct;
    }

    public void setDiscountPct(BigDecimal discountPct) {
        this.discountPct = discountPct;
    }

    public BigDecimal getCoverChargePerGuest() {
        return coverChargePerGuest;
    }

    public void setCoverChargePerGuest(BigDecimal coverChargePerGuest) {
        this.coverChargePerGuest = coverChargePerGuest;
    }

    public BigDecimal getTotalCoverCharge() {
        return totalCoverCharge;
    }

    public void setTotalCoverCharge(BigDecimal totalCoverCharge) {
        this.totalCoverCharge = totalCoverCharge;
    }

    public Boolean getIncludeVipPlan() {
        return includeVipPlan;
    }

    public void setIncludeVipPlan(Boolean includeVipPlan) {
        this.includeVipPlan = includeVipPlan;
    }

    public BigDecimal getVipPlanFee() {
        return vipPlanFee;
    }

    public void setVipPlanFee(BigDecimal vipPlanFee) {
        this.vipPlanFee = vipPlanFee;
    }

    public BigDecimal getTotalPaid() {
        return totalPaid;
    }

    public void setTotalPaid(BigDecimal totalPaid) {
        this.totalPaid = totalPaid;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getVerificationCode() {
        return verificationCode;
    }

    public void setVerificationCode(String verificationCode) {
        this.verificationCode = verificationCode;
    }

    public String getSpecialRequests() {
        return specialRequests;
    }

    public void setSpecialRequests(String specialRequests) {
        this.specialRequests = specialRequests;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public String getCancellationComments() {
        return cancellationComments;
    }

    public void setCancellationComments(String cancellationComments) {
        this.cancellationComments = cancellationComments;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(Instant cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public BigDecimal getRefundAmount() {
        return refundAmount;
    }

    public void setRefundAmount(BigDecimal refundAmount) {
        this.refundAmount = refundAmount;
    }

    public String getRefundStatus() {
        return refundStatus;
    }

    public void setRefundStatus(String refundStatus) {
        this.refundStatus = refundStatus;
    }

    public String getRefundRef() {
        return refundRef;
    }

    public void setRefundRef(String refundRef) {
        this.refundRef = refundRef;
    }

    public Integer getCoinsEarned() {
        return coinsEarned;
    }

    public void setCoinsEarned(Integer coinsEarned) {
        this.coinsEarned = coinsEarned;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public BigDecimal getBillAmount() {
        return billAmount;
    }

    public void setBillAmount(BigDecimal billAmount) {
        this.billAmount = billAmount;
    }

    public Instant getBillAddedAt() {
        return billAddedAt;
    }

    public void setBillAddedAt(Instant billAddedAt) {
        this.billAddedAt = billAddedAt;
    }
}
