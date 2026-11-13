package com.superapp.coupon.entity;

import com.superapp.coupon.enums.DiscountType;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "coupons", indexes = {
        @Index(name = "idx_coupons_code", columnList = "code"),
        @Index(name = "idx_coupons_active", columnList = "is_active"),
        @Index(name = "idx_coupons_store_id", columnList = "store_id")
})
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "headline", nullable = false, length = 255)
    private String headline;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "badge_text", nullable = false, length = 50)
    private String badgeText;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 30)
    private DiscountType discountType = DiscountType.PERCENTAGE;

    @Column(name = "discount_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "max_discount", precision = 10, scale = 2)
    private BigDecimal maxDiscount;

    @Column(name = "min_bill_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal minBillAmount = BigDecimal.ZERO;

    @Column(name = "partner_bank", length = 100)
    private String partnerBank = "ALL";

    @Column(name = "payment_method_required", length = 50)
    private String paymentMethodRequired = "ANY";

    @Column(name = "terms", columnDefinition = "TEXT", nullable = false)
    private String terms;

    @Column(name = "store_id")
    private UUID storeId;

    @Column(name = "merchant_id")
    private UUID merchantId;

    @Column(name = "category_id")
    private UUID categoryId;

    @Column(name = "usage_limit_total")
    private Integer usageLimitTotal = 10000;

    @Column(name = "usage_limit_per_user")
    private Integer usageLimitPerUser = 10;

    @Column(name = "current_usage_count", nullable = false)
    private Integer currentUsageCount = 0;

    @Column(name = "valid_from", nullable = false)
    private Instant validFrom = Instant.now();

    @Column(name = "valid_to", nullable = false)
    private Instant validTo;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "is_auto_applicable", nullable = false)
    private Boolean isAutoApplicable = false;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Coupon() {}

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code != null ? code.trim().toUpperCase() : null;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getHeadline() {
        return headline;
    }

    public void setHeadline(String headline) {
        this.headline = headline;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getBadgeText() {
        return badgeText;
    }

    public void setBadgeText(String badgeText) {
        this.badgeText = badgeText;
    }

    public DiscountType getDiscountType() {
        return discountType;
    }

    public void setDiscountType(DiscountType discountType) {
        this.discountType = discountType;
    }

    public BigDecimal getDiscountValue() {
        return discountValue;
    }

    public void setDiscountValue(BigDecimal discountValue) {
        this.discountValue = discountValue;
    }

    public BigDecimal getMaxDiscount() {
        return maxDiscount;
    }

    public void setMaxDiscount(BigDecimal maxDiscount) {
        this.maxDiscount = maxDiscount;
    }

    public BigDecimal getMinBillAmount() {
        return minBillAmount;
    }

    public void setMinBillAmount(BigDecimal minBillAmount) {
        this.minBillAmount = minBillAmount;
    }

    public String getPartnerBank() {
        return partnerBank;
    }

    public void setPartnerBank(String partnerBank) {
        this.partnerBank = partnerBank;
    }

    public String getPaymentMethodRequired() {
        return paymentMethodRequired;
    }

    public void setPaymentMethodRequired(String paymentMethodRequired) {
        this.paymentMethodRequired = paymentMethodRequired;
    }

    public String getTerms() {
        return terms;
    }

    public void setTerms(String terms) {
        this.terms = terms;
    }

    public UUID getStoreId() {
        return storeId;
    }

    public void setStoreId(UUID storeId) {
        this.storeId = storeId;
    }

    public UUID getMerchantId() {
        return merchantId;
    }

    public void setMerchantId(UUID merchantId) {
        this.merchantId = merchantId;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(UUID categoryId) {
        this.categoryId = categoryId;
    }

    public Integer getUsageLimitTotal() {
        return usageLimitTotal;
    }

    public void setUsageLimitTotal(Integer usageLimitTotal) {
        this.usageLimitTotal = usageLimitTotal;
    }

    public Integer getUsageLimitPerUser() {
        return usageLimitPerUser;
    }

    public void setUsageLimitPerUser(Integer usageLimitPerUser) {
        this.usageLimitPerUser = usageLimitPerUser;
    }

    public Integer getCurrentUsageCount() {
        return currentUsageCount;
    }

    public void setCurrentUsageCount(Integer currentUsageCount) {
        this.currentUsageCount = currentUsageCount;
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

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }

    public Boolean getIsAutoApplicable() {
        return isAutoApplicable;
    }

    public void setIsAutoApplicable(Boolean autoApplicable) {
        isAutoApplicable = autoApplicable;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
