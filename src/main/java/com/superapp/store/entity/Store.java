package com.superapp.store.entity;

import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.store.enums.StoreStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Store represents a physical branch location of a Merchant.
 * One Merchant can have multiple Stores.
 * Geographic location (address, coordinates, pincode, PostGIS location) strictly belongs to Store.
 */
@Entity
@Table(name = "stores")
public class Store {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "merchant_id", nullable = false)
    private UUID merchantId;

    @Column(name = "store_name", nullable = false, length = 255)
    private String storeName;

    @Column(name = "description", length = 2000)
    private String description;

    @Column(name = "address_line1", length = 255)
    private String addressLine1;

    @Column(name = "address_line2", length = 255)
    private String addressLine2;

    @Column(name = "address", nullable = false, length = 512)
    private String address;

    @Column(name = "city_id", length = 64)
    private String cityId;

    @Column(name = "state", nullable = false, length = 100)
    private String state;

    @Column(name = "pincode", nullable = false, length = 20)
    private String pincode;

    @Column(name = "latitude", nullable = false, precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(name = "longitude", nullable = false, precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "location")
    private String location;

    @Column(name = "phone", length = 20)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private StoreStatus status = StoreStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false, length = 32)
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING_APPROVAL;

    @Column(name = "rejection_reason", length = 1000)
    private String rejectionReason;

    @Column(name = "suspension_reason", length = 1000)
    private String suspensionReason;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Store() {
    }

    public Store(UUID merchantId, String storeName, String address, String cityId,
                 String state, String pincode, BigDecimal latitude, BigDecimal longitude) {
        this.merchantId = merchantId;
        this.storeName = storeName;
        this.addressLine1 = address;
        this.address = address;
        this.cityId = cityId;
        this.state = state;
        this.pincode = pincode;
        this.latitude = latitude;
        this.longitude = longitude;
        this.status = StoreStatus.ACTIVE;
        this.approvalStatus = ApprovalStatus.PENDING_APPROVAL;
        this.location = formatWkt(longitude, latitude);
    }

    public Store(UUID merchantId, String name, String description, String addressLine1,
                 String addressLine2, String cityId, String state, String pincode,
                 BigDecimal latitude, BigDecimal longitude, String phone) {
        this.merchantId = merchantId;
        this.storeName = name;
        this.description = description;
        this.addressLine1 = addressLine1;
        this.addressLine2 = addressLine2;
        this.address = buildFullAddress(addressLine1, addressLine2);
        this.cityId = cityId;
        this.state = state;
        this.pincode = pincode;
        this.latitude = latitude;
        this.longitude = longitude;
        this.phone = phone;
        this.status = StoreStatus.ACTIVE;
        this.approvalStatus = ApprovalStatus.PENDING_APPROVAL;
        this.location = formatWkt(longitude, latitude);
    }

    private static String buildFullAddress(String line1, String line2) {
        if (line1 == null || line1.isBlank()) {
            return line2 != null ? line2.trim() : "";
        }
        if (line2 == null || line2.isBlank()) {
            return line1.trim();
        }
        return line1.trim() + ", " + line2.trim();
    }

    public static String formatWkt(BigDecimal longitude, BigDecimal latitude) {
        if (longitude == null || latitude == null) return null;
        // PostGIS convention: Longitude FIRST, Latitude SECOND
        return "POINT(" + longitude.toPlainString() + " " + latitude.toPlainString() + ")";
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) this.status = StoreStatus.ACTIVE;
        if (this.approvalStatus == null) this.approvalStatus = ApprovalStatus.PENDING_APPROVAL;
        if (this.address == null) this.address = buildFullAddress(this.addressLine1, this.addressLine2);
        if (this.location == null) this.location = formatWkt(this.longitude, this.latitude);
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
        if (this.address == null || this.address.isBlank()) {
            this.address = buildFullAddress(this.addressLine1, this.addressLine2);
        }
        this.location = formatWkt(this.longitude, this.latitude);
    }

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

    public String getStoreName() {
        return storeName;
    }

    public void setStoreName(String storeName) {
        this.storeName = storeName;
    }

    // Alias for name <-> storeName
    public String getName() {
        return storeName;
    }

    public void setName(String name) {
        this.storeName = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAddressLine1() {
        return addressLine1;
    }

    public void setAddressLine1(String addressLine1) {
        this.addressLine1 = addressLine1;
    }

    public String getAddressLine2() {
        return addressLine2;
    }

    public void setAddressLine2(String addressLine2) {
        this.addressLine2 = addressLine2;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCityId() {
        return cityId;
    }

    public void setCityId(String cityId) {
        this.cityId = cityId;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
    }

    public BigDecimal getLatitude() {
        return latitude;
    }

    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public StoreStatus getStatus() {
        return status;
    }

    public void setStatus(StoreStatus status) {
        this.status = status;
    }

    public ApprovalStatus getApprovalStatus() {
        return approvalStatus;
    }

    public void setApprovalStatus(ApprovalStatus approvalStatus) {
        this.approvalStatus = approvalStatus;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public String getSuspensionReason() {
        return suspensionReason;
    }

    public void setSuspensionReason(String suspensionReason) {
        this.suspensionReason = suspensionReason;
    }

    public Instant getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(Instant approvedAt) {
        this.approvedAt = approvedAt;
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

    public boolean isApproved() {
        return ApprovalStatus.APPROVED.equals(this.approvalStatus);
    }

    public boolean isActive() {
        return StoreStatus.ACTIVE.equals(this.status);
    }

    public boolean isSuspended() {
        return StoreStatus.SUSPENDED.equals(this.status);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Store store)) return false;
        return Objects.equals(id, store.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
