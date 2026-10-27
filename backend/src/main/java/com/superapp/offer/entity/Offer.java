package com.superapp.offer.entity;

import com.superapp.offer.enums.OfferApprovalStatus;
import com.superapp.offer.enums.OfferStatus;
import com.superapp.offer.enums.OfferType;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "offers")
public class Offer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "merchant_id", nullable = false)
    private UUID merchantId;

    @Column(name = "store_id")
    private UUID storeId;

    @Column(name = "category_id")
    private UUID categoryId;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "terms_and_conditions", columnDefinition = "TEXT")
    private String termsAndConditions;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 32)
    private OfferType type = OfferType.CASHBACK;

    @Column(name = "value", nullable = false, precision = 10, scale = 2)
    private BigDecimal value;

    @Column(name = "min_transaction_amount", precision = 10, scale = 2)
    private BigDecimal minTransactionAmount;

    @Column(name = "max_discount_amount", precision = 10, scale = 2)
    private BigDecimal maxDiscountAmount;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Column(name = "per_customer_limit")
    private Integer perCustomerLimit;

    @Column(name = "current_usage_count", nullable = false)
    private Integer currentUsageCount = 0;

    @Column(name = "valid_from", nullable = false)
    private Instant validFrom;

    @Column(name = "valid_to", nullable = false)
    private Instant validTo;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private OfferStatus status = OfferStatus.CREATED;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false, length = 32)
    private OfferApprovalStatus approvalStatus = OfferApprovalStatus.DRAFT;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "bonus_coins")
    private Integer bonusCoins = 100;

    @Column(name = "badge_text", length = 100)
    private String badgeText;

    @Column(name = "recommendation_reason", length = 100)
    private String recommendationReason;

    @Column(name = "estimated_savings", precision = 10, scale = 2)
    private BigDecimal estimatedSavings = new BigDecimal("180.00");

    @Column(name = "image_url", length = 1024)
    private String imageUrl;

    @Column(name = "offer_scope", length = 32)
    private String offerScope = "SERVICE";

    @Column(name = "is_flash")
    private Boolean isFlash = false;

    @Column(name = "remaining_quantity")
    private Integer remainingQuantity = 50;

    @Column(name = "cta_text", length = 64)
    private String ctaText = "Book & Pay";

    @Column(name = "original_mrp", precision = 10, scale = 2)
    private BigDecimal originalMrp;

    @Column(name = "flash_selling_price", precision = 10, scale = 2)
    private BigDecimal flashSellingPrice;

    @Column(name = "redemption_type", length = 32)
    private String redemptionType = "BOTH";

    @Column(name = "min_advance_hours")
    private Integer minAdvanceHours = 0;

    @Column(name = "buy_quantity")
    private Integer buyQuantity = 1;

    @Column(name = "get_quantity")
    private Integer getQuantity = 1;

    @Column(name = "is_table_booking_enabled")
    private Boolean isTableBookingEnabled = false;

    @Column(name = "booking_type", length = 64)
    private String bookingType;

    @Column(name = "min_party_size")
    private Integer minPartySize = 1;

    @Column(name = "max_party_size")
    private Integer maxPartySize = 6;

    @Column(name = "available_tables_per_slot")
    private Integer availableTablesPerSlot = 5;

    @Column(name = "cover_charge_amount", precision = 10, scale = 2)
    private BigDecimal coverChargeAmount = BigDecimal.ZERO;

    @Column(name = "grace_period_minutes")
    private Integer gracePeriodMinutes = 15;

    @Column(name = "slot_times", columnDefinition = "TEXT")
    private String slotTimes;

    @Column(name = "seating_areas", columnDefinition = "TEXT")
    private String seatingAreas;

    @Column(name = "active_days", columnDefinition = "TEXT")
    private String activeDays;

    @Column(name = "start_time", length = 16)
    private String startTime;

    @Column(name = "end_time", length = 16)
    private String endTime;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "created_by", length = 64)
    private String createdBy;

    @Column(name = "updated_by", length = 64)
    private String updatedBy;

    public Offer() {
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) this.status = OfferStatus.CREATED;
        if (this.approvalStatus == null) this.approvalStatus = OfferApprovalStatus.DRAFT;
        if (this.type == null) this.type = OfferType.CASHBACK;
        if (this.currentUsageCount == null) this.currentUsageCount = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public boolean isValidAt(Instant time) {
        if (time == null) time = Instant.now();
        return OfferStatus.ACTIVE.equals(this.status)
                && OfferApprovalStatus.APPROVED.equals(this.approvalStatus)
                && !time.isBefore(this.validFrom)
                && !time.isAfter(this.validTo);
    }

    public boolean isExpired() {
        return Instant.now().isAfter(this.validTo);
    }

    public boolean isApproved() {
        return OfferApprovalStatus.APPROVED.equals(this.approvalStatus);
    }

    public boolean isPendingApproval() {
        return OfferApprovalStatus.PENDING_APPROVAL.equals(this.approvalStatus);
    }

    // Getters and Setters

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getMerchantId() {
        return merchantId;
    }

    public void setMerchantId(UUID merchantId) {
        this.merchantId = merchantId;
    }

    public UUID getStoreId() {
        return storeId;
    }

    public void setStoreId(UUID storeId) {
        this.storeId = storeId;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(UUID categoryId) {
        this.categoryId = categoryId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getTermsAndConditions() {
        return termsAndConditions;
    }

    public void setTermsAndConditions(String termsAndConditions) {
        this.termsAndConditions = termsAndConditions;
    }

    public OfferType getType() {
        return type;
    }

    public void setType(OfferType type) {
        this.type = type;
    }

    public BigDecimal getValue() {
        return value;
    }

    public void setValue(BigDecimal value) {
        this.value = value;
    }

    public BigDecimal getMinTransactionAmount() {
        return minTransactionAmount;
    }

    public void setMinTransactionAmount(BigDecimal minTransactionAmount) {
        this.minTransactionAmount = minTransactionAmount;
    }

    public BigDecimal getMaxDiscountAmount() {
        return maxDiscountAmount;
    }

    public void setMaxDiscountAmount(BigDecimal maxDiscountAmount) {
        this.maxDiscountAmount = maxDiscountAmount;
    }

    public Integer getUsageLimit() {
        return usageLimit;
    }

    public void setUsageLimit(Integer usageLimit) {
        this.usageLimit = usageLimit;
    }

    public Integer getPerCustomerLimit() {
        return perCustomerLimit;
    }

    public void setPerCustomerLimit(Integer perCustomerLimit) {
        this.perCustomerLimit = perCustomerLimit;
    }

    public Integer getCurrentUsageCount() {
        return currentUsageCount != null ? currentUsageCount : 0;
    }

    public void setCurrentUsageCount(Integer currentUsageCount) {
        this.currentUsageCount = currentUsageCount != null ? currentUsageCount : 0;
    }

    public Instant getValidFrom() {
        return validFrom;
    }

    public void setValidFrom(Instant validFrom) {
        this.validFrom = validFrom;
    }

    public Instant getValidTo() {
        return validTo;
    }

    public void setValidTo(Instant validTo) {
        this.validTo = validTo;
    }

    public OfferStatus getStatus() {
        return status;
    }

    public void setStatus(OfferStatus status) {
        this.status = status;
    }

    public OfferApprovalStatus getApprovalStatus() {
        return approvalStatus;
    }

    public void setApprovalStatus(OfferApprovalStatus approvalStatus) {
        this.approvalStatus = approvalStatus;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public Instant getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(Instant approvedAt) {
        this.approvedAt = approvedAt;
    }

    public UUID getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(UUID approvedBy) {
        this.approvedBy = approvedBy;
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

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    public Integer getBonusCoins() { return bonusCoins; }
    public void setBonusCoins(Integer bonusCoins) { this.bonusCoins = bonusCoins; }

    public String getBadgeText() { return badgeText; }
    public void setBadgeText(String badgeText) { this.badgeText = badgeText; }

    public String getRecommendationReason() { return recommendationReason; }
    public void setRecommendationReason(String recommendationReason) { this.recommendationReason = recommendationReason; }

    public BigDecimal getEstimatedSavings() { return estimatedSavings; }
    public void setEstimatedSavings(BigDecimal estimatedSavings) { this.estimatedSavings = estimatedSavings; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getOfferScope() { return offerScope; }
    public void setOfferScope(String offerScope) { this.offerScope = offerScope; }

    public Boolean getIsFlash() { return isFlash; }
    public void setIsFlash(Boolean isFlash) { this.isFlash = isFlash; }

    public Integer getRemainingQuantity() { return remainingQuantity; }
    public void setRemainingQuantity(Integer remainingQuantity) { this.remainingQuantity = remainingQuantity; }

    public String getCtaText() { return ctaText; }
    public void setCtaText(String ctaText) { this.ctaText = ctaText; }

    public BigDecimal getOriginalMrp() { return originalMrp; }
    public void setOriginalMrp(BigDecimal originalMrp) { this.originalMrp = originalMrp; }

    public BigDecimal getFlashSellingPrice() { return flashSellingPrice; }
    public void setFlashSellingPrice(BigDecimal flashSellingPrice) { this.flashSellingPrice = flashSellingPrice; }

    public String getRedemptionType() { return redemptionType != null ? redemptionType : "BOTH"; }
    public void setRedemptionType(String redemptionType) { this.redemptionType = redemptionType; }

    public Integer getMinAdvanceHours() { return minAdvanceHours != null ? minAdvanceHours : 0; }
    public void setMinAdvanceHours(Integer minAdvanceHours) { this.minAdvanceHours = minAdvanceHours; }

    public Integer getBuyQuantity() { return buyQuantity != null ? buyQuantity : 1; }
    public void setBuyQuantity(Integer buyQuantity) { this.buyQuantity = buyQuantity; }

    public Integer getGetQuantity() { return getQuantity != null ? getQuantity : 1; }
    public void setGetQuantity(Integer getQuantity) { this.getQuantity = getQuantity; }

    public Boolean getIsTableBookingEnabled() { return isTableBookingEnabled != null ? isTableBookingEnabled : false; }
    public void setIsTableBookingEnabled(Boolean isTableBookingEnabled) { this.isTableBookingEnabled = isTableBookingEnabled; }

    public String getBookingType() { return bookingType; }
    public void setBookingType(String bookingType) { this.bookingType = bookingType; }

    public Integer getMinPartySize() { return minPartySize != null ? minPartySize : 1; }
    public void setMinPartySize(Integer minPartySize) { this.minPartySize = minPartySize; }

    public Integer getMaxPartySize() { return maxPartySize != null ? maxPartySize : 6; }
    public void setMaxPartySize(Integer maxPartySize) { this.maxPartySize = maxPartySize; }

    public Integer getAvailableTablesPerSlot() { return availableTablesPerSlot != null ? availableTablesPerSlot : 5; }
    public void setAvailableTablesPerSlot(Integer availableTablesPerSlot) { this.availableTablesPerSlot = availableTablesPerSlot; }

    public BigDecimal getCoverChargeAmount() { return coverChargeAmount != null ? coverChargeAmount : BigDecimal.ZERO; }
    public void setCoverChargeAmount(BigDecimal coverChargeAmount) { this.coverChargeAmount = coverChargeAmount; }

    public Integer getGracePeriodMinutes() { return gracePeriodMinutes != null ? gracePeriodMinutes : 15; }
    public void setGracePeriodMinutes(Integer gracePeriodMinutes) { this.gracePeriodMinutes = gracePeriodMinutes; }

    public String getSlotTimes() { return slotTimes; }
    public void setSlotTimes(String slotTimes) { this.slotTimes = slotTimes; }

    public String getSeatingAreas() { return seatingAreas; }
    public void setSeatingAreas(String seatingAreas) { this.seatingAreas = seatingAreas; }

    public String getActiveDays() { return activeDays; }
    public void setActiveDays(String activeDays) { this.activeDays = activeDays; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Offer offer)) return false;
        return Objects.equals(id, offer.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
