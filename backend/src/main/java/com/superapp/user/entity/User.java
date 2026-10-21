package com.superapp.user.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * JPA entity mapping to the 'users' database table.
 * Extended with: name, mobile, status (ACTIVE/INACTIVE/BLOCKED),
 * emailVerified, mobileVerified for the SuperApp foundation.
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "phone", unique = true, length = 20)
    private String phone;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 50)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    @Column(name = "mobile_verified", nullable = false)
    private boolean mobileVerified = false;

    @Column(name = "profile_completed", nullable = false)
    private boolean profileCompleted = false;

    @Column(name = "birthday")
    private java.time.LocalDate birthday;

    @Column(name = "primary_city", length = 100)
    private String primaryCity;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "district", length = 100)
    private String district;

    @Column(name = "pincode", length = 20)
    private String pincode;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "gender", length = 20)
    private String gender;

    @Column(name = "primary_zone", length = 255)
    private String primaryZone;

    @Column(name = "referral_code", length = 50)
    private String referralCode;

    @Column(name = "referred_by_code", length = 50)
    private String referredByCode;

    @Column(name = "whatsapp_alerts_enabled")
    private boolean whatsappAlertsEnabled = true;

    @Column(name = "soundbox_stay_signed_in")
    private boolean soundboxStaySignedIn = false;

    @Column(name = "category_preferences", length = 1000)
    private String categoryPreferences;

    @Column(name = "precise_location_granted")
    private boolean preciseLocationGranted = false;

    @Column(name = "flash_alerts_granted")
    private boolean flashAlertsGranted = false;

    @Column(name = "last_known_latitude")
    private Double lastKnownLatitude;

    @Column(name = "last_known_longitude")
    private Double lastKnownLongitude;

    @Column(name = "profile_picture_url", length = 1024)
    private String profilePictureUrl;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public User() {}

    public User(String email, String name, String firstName, String lastName,
                String password, Role role) {
        this.email = email;
        this.name = name;
        this.firstName = firstName;
        this.lastName = lastName;
        this.password = password;
        this.role = role;
        this.status = UserStatus.ACTIVE;
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) {
            this.status = UserStatus.ACTIVE;
        }
        if (this.name == null || this.name.isBlank()) {
            String fn = this.firstName != null ? this.firstName.trim() : "";
            String ln = this.lastName != null ? this.lastName.trim() : "";
            this.name = (fn + " " + ln).trim();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
        if (this.name == null || this.name.isBlank()) {
            String fn = this.firstName != null ? this.firstName.trim() : "";
            String ln = this.lastName != null ? this.lastName.trim() : "";
            this.name = (fn + " " + ln).trim();
        }
    }

    // ---- Getters & Setters ----

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    // Mobile is an alias to the canonical phone column
    public String getMobile() { return phone; }
    public void setMobile(String mobile) { this.phone = mobile; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public UserStatus getStatus() { return status; }
    public void setStatus(UserStatus status) { this.status = status; }

    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }

    public boolean isMobileVerified() { return mobileVerified; }
    public void setMobileVerified(boolean mobileVerified) { this.mobileVerified = mobileVerified; }

    public boolean isProfileCompleted() { return profileCompleted; }
    public void setProfileCompleted(boolean profileCompleted) { this.profileCompleted = profileCompleted; }

    public java.time.LocalDate getBirthday() { return birthday; }
    public void setBirthday(java.time.LocalDate birthday) { this.birthday = birthday; }

    public String getPrimaryCity() { return primaryCity; }
    public void setPrimaryCity(String primaryCity) { this.primaryCity = primaryCity; }

    public String getPrimaryZone() { return primaryZone; }
    public void setPrimaryZone(String primaryZone) { this.primaryZone = primaryZone; }

    public String getReferralCode() { return referralCode; }
    public void setReferralCode(String referralCode) { this.referralCode = referralCode; }

    public String getReferredByCode() { return referredByCode; }
    public void setReferredByCode(String referredByCode) { this.referredByCode = referredByCode; }

    public boolean isWhatsappAlertsEnabled() { return whatsappAlertsEnabled; }
    public void setWhatsappAlertsEnabled(boolean whatsappAlertsEnabled) { this.whatsappAlertsEnabled = whatsappAlertsEnabled; }

    public boolean isSoundboxStaySignedIn() { return soundboxStaySignedIn; }
    public void setSoundboxStaySignedIn(boolean soundboxStaySignedIn) { this.soundboxStaySignedIn = soundboxStaySignedIn; }

    public String getCategoryPreferences() { return categoryPreferences; }
    public void setCategoryPreferences(String categoryPreferences) { this.categoryPreferences = categoryPreferences; }

    public boolean isPreciseLocationGranted() { return preciseLocationGranted; }
    public void setPreciseLocationGranted(boolean preciseLocationGranted) { this.preciseLocationGranted = preciseLocationGranted; }

    public boolean isFlashAlertsGranted() { return flashAlertsGranted; }
    public void setFlashAlertsGranted(boolean flashAlertsGranted) { this.flashAlertsGranted = flashAlertsGranted; }

    public Double getLastKnownLatitude() { return lastKnownLatitude; }
    public void setLastKnownLatitude(Double lastKnownLatitude) { this.lastKnownLatitude = lastKnownLatitude; }

    public Double getLastKnownLongitude() { return lastKnownLongitude; }
    public void setLastKnownLongitude(Double lastKnownLongitude) { this.lastKnownLongitude = lastKnownLongitude; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public boolean isActive() {
        return UserStatus.ACTIVE.equals(this.status);
    }

    public boolean isSuspended() {
        return UserStatus.SUSPENDED.equals(this.status) || UserStatus.BLOCKED.equals(this.status);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return Objects.equals(id, user.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        // Never include password in toString
        return "User{id=" + id + ", email='" + email + "', name='" + name
                + "', role=" + role + ", status=" + status + "}";
    }
}
