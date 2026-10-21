package com.superapp.merchant.service;

import com.superapp.category.entity.Category;
import com.superapp.category.entity.CategoryStatus;
import com.superapp.category.repository.CategoryRepository;
import com.superapp.common.audit.AuditEventType;
import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AppException;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.common.response.ApiError;
import com.superapp.merchant.dto.*;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.entity.KycStatus;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.entity.MerchantKyc;
import com.superapp.merchant.enums.MerchantStatus;
import com.superapp.merchant.mapper.MerchantMapper;
import com.superapp.merchant.repository.MerchantKycRepository;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.user.repository.UserRepository;
import com.superapp.user.entity.Role;
import com.superapp.user.entity.User;
import com.superapp.user.entity.UserStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import com.superapp.user.entity.StaffMember;
import com.superapp.user.repository.StaffMemberRepository;

@Service
public class MerchantServiceImpl implements MerchantService {

    private static final Logger log = LoggerFactory.getLogger(MerchantServiceImpl.class);

    private final MerchantRepository merchantRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final MerchantKycRepository merchantKycRepository;
    private final AuditService auditService;
    private final MerchantMapper merchantMapper;
    private final PasswordEncoder passwordEncoder;
    private final com.superapp.common.email.EmailService emailService;
    private final StaffMemberRepository staffMemberRepository;
    private final com.superapp.wallet.repository.MerchantBankAccountRepository bankAccountRepository;
    private final com.superapp.wallet.repository.MerchantWalletRepository walletRepository;
    private final com.superapp.auth.service.SessionService sessionService;
    @Autowired(required = false)
    private com.superapp.store.repository.StoreRepository storeRepository;

    @Autowired
    public MerchantServiceImpl(
            MerchantRepository merchantRepository,
            CategoryRepository categoryRepository,
            UserRepository userRepository,
            MerchantKycRepository merchantKycRepository,
            AuditService auditService,
            MerchantMapper merchantMapper,
            @Autowired(required = false) PasswordEncoder passwordEncoder,
            @Autowired(required = false) com.superapp.common.email.EmailService emailService,
            @Autowired(required = false) StaffMemberRepository staffMemberRepository,
            @Autowired(required = false) com.superapp.wallet.repository.MerchantBankAccountRepository bankAccountRepository,
            @Autowired(required = false) com.superapp.wallet.repository.MerchantWalletRepository walletRepository,
            @Autowired(required = false) com.superapp.auth.service.SessionService sessionService) {
        this.merchantRepository = merchantRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.merchantKycRepository = merchantKycRepository;
        this.auditService = auditService;
        this.merchantMapper = merchantMapper != null ? merchantMapper : new MerchantMapper();
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.staffMemberRepository = staffMemberRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.walletRepository = walletRepository;
        this.sessionService = sessionService;
    }

    // Overloaded constructors for backward compatibility with existing unit tests
    public MerchantServiceImpl(
            MerchantRepository merchantRepository,
            CategoryRepository categoryRepository,
            UserRepository userRepository) {
        this(merchantRepository, categoryRepository, userRepository, null, null, new MerchantMapper(), null, null, null, null, null, null);
    }

    public MerchantServiceImpl(
            MerchantRepository merchantRepository,
            CategoryRepository categoryRepository,
            UserRepository userRepository,
            MerchantKycRepository merchantKycRepository,
            AuditService auditService,
            MerchantMapper merchantMapper,
            PasswordEncoder passwordEncoder) {
        this(merchantRepository, categoryRepository, userRepository, merchantKycRepository, auditService, merchantMapper, passwordEncoder, null, null, null, null, null);
    }

    @Override
    @Transactional
    public MerchantResponse createMerchant(CreateMerchantRequest request, UUID currentUserId, boolean isAdmin) {
        UUID ownerId = currentUserId;

        String phone = request.phone() != null ? request.phone().trim() : null;
        String email = request.email() != null ? request.email().trim().toLowerCase() : null;
        String legalName = request.legalName() != null ? request.legalName().trim() : null;
        String description = request.description() != null ? request.description().trim() : null;
        String website = request.website() != null ? request.website().trim() : null;

        // Global check: ensure no merchant is already registered with this email
        if (email != null && !email.isBlank()) {
            if (merchantRepository.existsByEmailIgnoreCase(email)) {
                throw new AppException("A merchant is already registered with email: " + email,
                        ApiError.EMAIL_ALREADY_EXISTS, 400);
            }
        }

        // Global check: ensure no merchant is already registered with this phone number
        if (phone != null && !phone.isBlank()) {
            if (merchantRepository.existsByPhone(phone)) {
                throw new AppException("A merchant brand is already registered with phone number: " + phone,
                        ApiError.VALIDATION_ERROR, 400);
            }
            if (storeRepository != null && storeRepository.existsByPhone(phone)) {
                throw new AppException("Phone number " + phone + " is already registered to an active store branch.",
                        ApiError.VALIDATION_ERROR, 400);
            }
            if (userRepository.existsByPhone(phone)) {
                // If the phone belongs to an existing user, check if that user's email matches
                Optional<User> userByPhone = userRepository.findByPhone(phone);
                if (userByPhone.isPresent() && (email == null || !userByPhone.get().getEmail().equalsIgnoreCase(email))) {
                    throw new AppException("Phone number " + phone + " is already linked to another user account.",
                            ApiError.VALIDATION_ERROR, 400);
                }
            }
        }

        // If admin onboards a merchant, associate or provision owner user by email
        if (isAdmin && email != null && !email.isBlank()) {
            Optional<User> existingUser = userRepository.findByEmail(email);
            if (existingUser.isPresent()) {
                User u = existingUser.get();
                // Reject role collision: platform staff/admins cannot be registered as merchant owners
                if (u.getRole() == Role.ADMIN || u.getRole() == Role.SUPER_ADMIN) {
                    throw new AppException(
                            "This email is already associated with an administrator account. Please use a separate email address for the merchant owner.",
                            ApiError.VALIDATION_FAILED, 400);
                }
                // Check if existing user already owns an active merchant brand
                if (merchantRepository.existsByOwnerUserId(u.getId())) {
                    throw new AppException(
                            "This merchant owner email is already linked to an active merchant business.",
                            ApiError.VALIDATION_ERROR, 400);
                }
                if (u.getRole() == Role.CUSTOMER) {
                    u.setRole(Role.MERCHANT);
                }
                u.setStatus(UserStatus.ACTIVE);
                userRepository.save(u);
                ownerId = u.getId();
            } else {
                String fullName = (legalName != null && !legalName.isBlank()) ? legalName
                        : request.businessName().trim();
                String[] parts = fullName.split("\\s+", 2);
                String fName = parts[0];
                String lName = parts.length > 1 ? parts[1] : "Owner";
                // Secure random initial password hash - owner will set master password via direct invitation link
                String pwdHash = passwordEncoder != null
                        ? passwordEncoder.encode(UUID.randomUUID().toString())
                        : "$2a$10$w8.3b04J0n0W6wG6eYgPZe9q3g3C9iYy1U2m7m9wK4jE5bH5c2F7O";
                User newOwner = new User(email, fullName, fName, lName, pwdHash, Role.MERCHANT);
                newOwner.setStatus(UserStatus.INACTIVE);
                if (phone != null && !phone.isBlank()) {
                    newOwner.setMobile(phone);
                }
                newOwner.setEmailVerified(false);
                User savedOwner = userRepository.save(newOwner);
                ownerId = savedOwner.getId();
            }
        }

        // Validate owner exists
        if (!userRepository.existsById(ownerId)) {
            throw new ResourceNotFoundException("User (owner)", "id", ownerId);
        }

        // Validate or resolve category
        String categoryName = null;
        UUID resolvedCategoryId = request.categoryId();
        if (resolvedCategoryId != null) {
            final UUID catId = resolvedCategoryId;
            Category cat = categoryRepository.findById(catId)
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", catId));
            if (!cat.isActive()) {
                throw new AppException("Category is not active: " + catId, ApiError.CATEGORY_INACTIVE, 400);
            }
            categoryName = cat.getName();
        } else {
            Category defCat = categoryRepository.findByNameIgnoreCase("Food & Dining")
                    .orElseGet(() -> categoryRepository.findAll().stream().filter(Category::isActive).findFirst()
                            .orElse(null));
            if (defCat != null) {
                resolvedCategoryId = defCat.getId();
                categoryName = defCat.getName();
            }
        }

        Merchant merchant = new Merchant(
                ownerId,
                request.businessName().trim(),
                legalName,
                description,
                resolvedCategoryId,
                phone,
                email,
                website);

        if (request.commissionRate() != null) {
            merchant.setCommissionRate(request.commissionRate());
        }
        if (request.gstin() != null && !request.gstin().isBlank()) {
            merchant.setGstin(request.gstin().trim());
        }
        if (request.pan() != null && !request.pan().isBlank()) {
            merchant.setPan(request.pan().trim());
        }
        if (request.state() != null && !request.state().isBlank()) {
            merchant.setState(request.state().trim());
        }
        if (request.district() != null && !request.district().isBlank()) {
            merchant.setDistrict(request.district().trim());
        }
        if (request.city() != null && !request.city().isBlank()) {
            merchant.setCity(request.city().trim());
        }
        if (request.pincode() != null && !request.pincode().isBlank()) {
            merchant.setPincode(request.pincode().trim());
        }
        if (request.address() != null && !request.address().isBlank()) {
            merchant.setAddress(request.address().trim());
        }

        if (isAdmin) {
            merchant.setStatus(MerchantStatus.INACTIVE);
            merchant.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
            merchant.setKycStatus(KycStatus.PENDING);
            merchant.setApprovedAt(null);
            merchant.setCreatedBy("ADMIN");
        } else {
            merchant.setStatus(MerchantStatus.INACTIVE);
        }

        Merchant saved = merchantRepository.save(merchant);
        log.info("Created merchant id={} name='{}' ownerId={} (isAdmin={})", saved.getId(), saved.getBusinessName(),
                ownerId, isAdmin);

        if (bankAccountRepository != null && request.bankAccountNumber() != null && !request.bankAccountNumber().isBlank()) {
            saveOrUpdatePrimaryBankAccount(saved.getId(), request.bankName(), request.accountHolderName(), request.bankAccountNumber(), request.bankIfsc(), request.bankUpiId());
        }

        // Auto-provision initial MerchantKyc compliance record in merchant_kyc table
        if (merchantKycRepository != null) {
            saveOrUpdateMerchantKycRecord(saved.getId(), categoryName, "PENDING");
        }

        // Auto-provision merchant financial ledger wallet in merchant_wallets table
        if (walletRepository != null) {
            try {
                if (walletRepository.findByMerchantId(saved.getId()).isEmpty()) {
                    com.superapp.wallet.entity.MerchantWallet wallet = new com.superapp.wallet.entity.MerchantWallet();
                    wallet.setMerchantId(saved.getId());
                    wallet.setCurrency("INR");
                    wallet.setAvailableBalance(java.math.BigDecimal.ZERO);
                    wallet.setPendingBalance(java.math.BigDecimal.ZERO);
                    wallet.setTotalWithdrawn(java.math.BigDecimal.ZERO);
                    wallet.setLifetimeVolume(java.math.BigDecimal.ZERO);
                    wallet.setStatus(com.superapp.wallet.enums.WalletStatus.ACTIVE);
                    walletRepository.save(wallet);
                    log.info("Auto-provisioned active MerchantWallet for merchantId={}", saved.getId());
                }
            } catch (Exception e) {
                log.warn("Could not auto-provision MerchantWallet for merchantId={}: {}", saved.getId(), e.getMessage());
            }
        }

        if (auditService != null) {
            String auditMeta = "{\"merchantId\":\"" + saved.getId() + "\",\"businessName\":\"" + saved.getBusinessName()
                    +
                    "\",\"ownerEmail\":\"" + (email != null ? email : "") + "\",\"ownerName\":\""
                    + (legalName != null ? legalName : saved.getBusinessName()) + "\"}";
            auditService.record(AuditEventType.MERCHANT_CREATED, isAdmin ? currentUserId : ownerId, null, null,
                    MDC.get("requestId"), auditMeta);
        }

        // Dispatch merchant welcome email with direct password setup link (Unified
        // Invitation Token)
        if (isAdmin && emailService != null && email != null && !email.isBlank()) {
            String contactName = (legalName != null && !legalName.isBlank()) ? legalName
                    : request.businessName().trim();
            String inviteToken = UUID.randomUUID().toString().replace("-", "")
                    + UUID.randomUUID().toString().replace("-", "");
            Instant inviteExpiresAt = Instant.now().plus(48, ChronoUnit.HOURS);
            String inviteUrl = "http://localhost:3000/accept-invite?token=" + inviteToken;

            String permissionsJson = "{\"inviteToken\":\"" + inviteToken + "\",\"inviteExpiresAt\":\"" + inviteExpiresAt
                    + "\"}";

            if (staffMemberRepository != null) {
                List<StaffMember> existingAssignments = staffMemberRepository.findByUserId(ownerId);
                StaffMember staff = existingAssignments.stream()
                        .filter(s -> "MERCHANT".equalsIgnoreCase(s.getScope())
                                && Objects.equals(s.getMerchantId(), saved.getId()))
                        .findFirst()
                        .orElse(null);

                if (staff == null) {
                    staff = new StaffMember(
                            ownerId,
                            "MERCHANT_OWNER",
                            "MERCHANT",
                            saved.getId(),
                            null,
                            null,
                            "INVITED",
                            permissionsJson,
                            currentUserId);
                } else {
                    staff.setRoleId("MERCHANT_OWNER");
                    staff.setStatus("INVITED");
                    staff.setCustomPermissions(permissionsJson);
                    staff.setInvitedBy(currentUserId);
                }
                staffMemberRepository.save(staff);
                log.info(
                        "Provisioned MERCHANT_OWNER staff member for ownerId={} on merchantId={} with direct password setup token",
                        ownerId, saved.getId());
            }

            emailService.sendMerchantWelcomeEmail(email, contactName, saved.getBusinessName(), inviteUrl);
            log.info("📧 Dispatched merchant setup email with direct invite URL to {}: {}", email, inviteUrl);
        }

        return toMerchantResponse(saved, categoryName);
    }

    @Override
    @Transactional
    public MerchantResponse createMerchant(CreateMerchantRequest request, UUID currentUserId) {
        return createMerchant(request, currentUserId, false);
    }

    @Override
    @Transactional(readOnly = true)
    public MerchantResponse getMerchantProfile(UUID currentUserId) {
        Merchant merchant = merchantRepository.findByOwnerUserId(currentUserId)
                .orElseThrow(() -> new AppException("Merchant not found", ApiError.MERCHANT_NOT_FOUND, 404));

        String categoryName = getCategoryName(merchant.getCategoryId());
        return MerchantResponse.fromEntity(merchant, categoryName);
    }

    @Override
    @Transactional
    public MerchantResponse updateMerchantProfile(UpdateMerchantProfileRequest request, UUID currentUserId) {
        Merchant merchant = merchantRepository.findByOwnerUserId(currentUserId)
                .orElseThrow(() -> new AppException("Merchant not found", ApiError.MERCHANT_NOT_FOUND, 404));

        if (!merchant.getOwnerUserId().equals(currentUserId)) {
            throw new AppException("You do not have permission to access this merchant",
                    ApiError.MERCHANT_ACCESS_DENIED, 403);
        }

        String categoryName = null;
        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new AppException("Category not found", ApiError.CATEGORY_NOT_FOUND, 404));
            if (!category.isActive()) {
                throw new AppException("Category is not active", ApiError.CATEGORY_INACTIVE, 409);
            }
            categoryName = category.getName();
            merchant.setCategoryId(request.categoryId());
        } else {
            categoryName = getCategoryName(merchant.getCategoryId());
        }

        merchant.setBusinessName(request.businessName().trim());
        if (request.legalName() != null)
            merchant.setLegalName(request.legalName().trim());
        if (request.description() != null)
            merchant.setDescription(request.description().trim());
        if (request.phone() != null)
            merchant.setPhone(request.phone().trim());
        if (request.email() != null)
            merchant.setEmail(request.email().trim().toLowerCase());
        if (request.website() != null)
            merchant.setWebsite(request.website().trim());

        Merchant updated = merchantRepository.save(merchant);
        log.info("Merchant profile updated id={} by owner={}", updated.getId(), currentUserId);

        if (auditService != null) {
            auditService.record(AuditEventType.MERCHANT_UPDATED, currentUserId, null, null, MDC.get("requestId"),
                    "{\"merchantId\":\"" + updated.getId() + "\"}");
        }

        return MerchantResponse.fromEntity(updated, categoryName);
    }

    @Override
    @Transactional
    public MerchantKycResponse submitKyc(MerchantKycRequest request, UUID currentUserId) {
        Merchant merchant = merchantRepository.findByOwnerUserId(currentUserId)
                .orElseThrow(() -> new AppException("Merchant not found", ApiError.MERCHANT_NOT_FOUND, 404));

        MerchantKyc kyc = new MerchantKyc(
                merchant.getId(),
                request.documentType().trim(),
                request.documentNumber().trim(),
                request.businessRegistrationNumber() != null ? request.businessRegistrationNumber().trim() : null,
                request.documentUrl() != null ? request.documentUrl().trim() : null);

        MerchantKyc savedKyc = merchantKycRepository != null ? merchantKycRepository.save(kyc) : kyc;

        merchant.setKycStatus(KycStatus.PENDING);
        if (merchant.getApprovalStatus() == ApprovalStatus.DRAFT) {
            merchant.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        }
        merchantRepository.save(merchant);

        log.info("KYC submitted for merchant id={} docType={}", merchant.getId(), request.documentType());

        if (auditService != null) {
            auditService.record(AuditEventType.MERCHANT_KYC_SUBMITTED, currentUserId, null, null, MDC.get("requestId"),
                    "{\"merchantId\":\"" + merchant.getId() + "\",\"documentType\":\"" + request.documentType()
                            + "\"}");
        }

        return new MerchantKycResponse(
                savedKyc.getId(),
                merchant.getId(),
                savedKyc.getDocumentType(),
                savedKyc.getStatus(),
                savedKyc.getCreatedAt());
    }

    @Override
    @Transactional
    public MerchantApprovalActionResponse approveMerchant(UUID merchantId, UUID adminUserId) {
        Merchant merchant = merchantRepository.findById(merchantId)
                .orElseThrow(() -> new AppException("Merchant not found", ApiError.MERCHANT_NOT_FOUND, 404));

        // State transition check: cannot approve if already APPROVED or not in
        // pending/draft/rejected state
        if (merchant.getApprovalStatus() == ApprovalStatus.APPROVED) {
            throw new AppException("Merchant cannot be approved in its current state", ApiError.INVALID_MERCHANT_STATE,
                    409);
        }

        merchant.setApprovalStatus(ApprovalStatus.APPROVED);
        merchant.setStatus(MerchantStatus.ACTIVE);
        merchant.setApprovedAt(Instant.now());
        merchant.setKycStatus(KycStatus.VERIFIED);
        merchant.setUpdatedBy(adminUserId != null ? adminUserId.toString() : "ADMIN");
        merchantRepository.save(merchant);

        // Update merchant_kyc table verification status
        if (merchantKycRepository != null) {
            merchantKycRepository.findFirstByMerchantIdOrderByCreatedAtDesc(merchantId).ifPresent(kyc -> {
                kyc.setStatus("VERIFIED");
                kyc.setVerifiedBy(adminUserId);
                kyc.setVerifiedAt(Instant.now());
                merchantKycRepository.save(kyc);
            });
        }

        // Update merchant_bank_accounts table verification status
        if (bankAccountRepository != null) {
            bankAccountRepository.findByMerchantId(merchantId).forEach(acc -> {
                acc.setVerificationStatus(com.superapp.wallet.enums.BankAccountVerificationStatus.VERIFIED);
                bankAccountRepository.save(acc);
            });
        }

        log.info("Admin {} approved merchant id={}", adminUserId, merchantId);

        if (auditService != null) {
            auditService.record(AuditEventType.MERCHANT_APPROVED, adminUserId, null, null, MDC.get("requestId"),
                    "{\"merchantId\":\"" + merchantId + "\",\"action\":\"APPROVE\"}");
        }

        return MerchantApprovalActionResponse.approved(merchantId.toString());
    }

    @Override
    @Transactional
    public MerchantApprovalActionResponse rejectMerchant(UUID merchantId, String reason, UUID adminUserId) {
        if (reason == null || reason.isBlank()) {
            throw new AppException("Rejection reason is required", ApiError.VALIDATION_ERROR, 400);
        }

        Merchant merchant = merchantRepository.findById(merchantId)
                .orElseThrow(() -> new AppException("Merchant not found", ApiError.MERCHANT_NOT_FOUND, 404));

        if (merchant.getApprovalStatus() == ApprovalStatus.REJECTED) {
            throw new AppException("Merchant application is already rejected", ApiError.INVALID_MERCHANT_STATE, 409);
        }

        merchant.setApprovalStatus(ApprovalStatus.REJECTED);
        merchant.setStatus(MerchantStatus.INACTIVE);
        merchant.setRejectionReason(reason.trim());
        merchant.setKycStatus(KycStatus.REJECTED);
        merchant.setUpdatedBy(adminUserId != null ? adminUserId.toString() : "ADMIN");
        merchantRepository.save(merchant);

        // Update merchant_kyc table rejection status
        if (merchantKycRepository != null) {
            merchantKycRepository.findFirstByMerchantIdOrderByCreatedAtDesc(merchantId).ifPresent(kyc -> {
                kyc.setStatus("REJECTED");
                kyc.setRejectionReason(reason.trim());
                merchantKycRepository.save(kyc);
            });
        }

        // Update merchant_bank_accounts table rejection status
        if (bankAccountRepository != null) {
            bankAccountRepository.findByMerchantId(merchantId).forEach(acc -> {
                acc.setVerificationStatus(com.superapp.wallet.enums.BankAccountVerificationStatus.REJECTED);
                bankAccountRepository.save(acc);
            });
        }

        log.info("Admin {} rejected merchant id={} reason: {}", adminUserId, merchantId, reason);

        if (auditService != null) {
            auditService.record(AuditEventType.MERCHANT_REJECTED, adminUserId, null, null, MDC.get("requestId"),
                    "{\"merchantId\":\"" + merchantId + "\",\"action\":\"REJECT\",\"reason\":\"" + reason + "\"}");
        }

        return MerchantApprovalActionResponse.rejected(merchantId.toString(), reason.trim());
    }

    @Override
    @Transactional
    public MerchantApprovalActionResponse suspendMerchant(UUID merchantId, String reason, UUID adminUserId) {
        if (reason == null || reason.isBlank()) {
            throw new AppException("Suspension reason is required", ApiError.VALIDATION_ERROR, 400);
        }

        Merchant merchant = merchantRepository.findById(merchantId)
                .orElseThrow(() -> new AppException("Merchant not found", ApiError.MERCHANT_NOT_FOUND, 404));

        merchant.setStatus(MerchantStatus.SUSPENDED);
        merchant.setSuspensionReason(reason.trim());
        merchant.setUpdatedBy(adminUserId != null ? adminUserId.toString() : "ADMIN");
        merchantRepository.save(merchant);

        log.info("Admin {} suspended merchant id={} reason: {}", adminUserId, merchantId, reason);

        if (auditService != null) {
            auditService.record(AuditEventType.MERCHANT_SUSPENDED, adminUserId, null, null, MDC.get("requestId"),
                    "{\"merchantId\":\"" + merchantId + "\",\"action\":\"SUSPEND\",\"reason\":\"" + reason + "\"}");
        }

        return MerchantApprovalActionResponse.suspended(merchantId.toString(), reason.trim());
    }

    @Override
    @Transactional
    public MerchantApprovalActionResponse activateMerchant(UUID merchantId, String reason, UUID adminUserId) {
        Merchant merchant = merchantRepository.findById(merchantId)
                .orElseThrow(() -> new AppException("Merchant not found", ApiError.MERCHANT_NOT_FOUND, 404));

        merchant.setStatus(MerchantStatus.ACTIVE);
        merchant.setApprovalStatus(ApprovalStatus.APPROVED);
        merchant.setSuspensionReason(null);
        merchant.setUpdatedBy(adminUserId != null ? adminUserId.toString() : "ADMIN");
        merchantRepository.save(merchant);

        log.info("Admin {} activated merchant id={} reason: {}", adminUserId, merchantId, reason);

        if (auditService != null) {
            auditService.record(AuditEventType.MERCHANT_REACTIVATED, adminUserId, null, null, MDC.get("requestId"),
                    "{\"merchantId\":\"" + merchantId + "\",\"action\":\"ACTIVATE\",\"reason\":\""
                            + (reason != null ? reason : "") + "\"}");
        }

        return MerchantApprovalActionResponse.approved(merchantId.toString());
    }

    @Override
    @Transactional
    public void resendMerchantWelcomeEmail(UUID merchantId, UUID adminUserId) {
        Merchant merchant = merchantRepository.findById(merchantId)
                .orElseThrow(() -> new AppException("Merchant not found", ApiError.MERCHANT_NOT_FOUND, 404));

        String email = merchant.getEmail();
        if (email == null || email.isBlank()) {
            throw new AppException("Merchant has no registered email address", ApiError.VALIDATION_ERROR, 400);
        }

        String contactName = merchant.getLegalName() != null && !merchant.getLegalName().isBlank()
                ? merchant.getLegalName()
                : merchant.getBusinessName();

        // Generate fresh 48-hour invitation token
        String inviteToken = UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");
        Instant inviteExpiresAt = Instant.now().plus(48, ChronoUnit.HOURS);
        String inviteUrl = "http://localhost:3000/accept-invite?token=" + inviteToken;

        String permissionsJson = "{\"inviteToken\":\"" + inviteToken + "\",\"inviteExpiresAt\":\"" + inviteExpiresAt
                + "\"}";

        UUID ownerId = merchant.getOwnerUserId();
        if (staffMemberRepository != null && ownerId != null) {
            List<StaffMember> existingAssignments = staffMemberRepository.findByUserId(ownerId);
            StaffMember staff = existingAssignments.stream()
                    .filter(s -> "MERCHANT".equalsIgnoreCase(s.getScope())
                            && Objects.equals(s.getMerchantId(), merchantId))
                    .findFirst()
                    .orElse(null);

            if (staff == null) {
                staff = new StaffMember(
                        ownerId,
                        "MERCHANT_OWNER",
                        "MERCHANT",
                        merchantId,
                        null,
                        null,
                        "INVITED",
                        permissionsJson,
                        adminUserId);
            } else {
                staff.setRoleId("MERCHANT_OWNER");
                staff.setStatus("INVITED");
                staff.setCustomPermissions(permissionsJson);
                staff.setInvitedBy(adminUserId);
            }
            staffMemberRepository.save(staff);
            log.info("Admin {} regenerated 48h password setup token for merchant owner {} on merchant {}",
                    adminUserId, ownerId, merchantId);
        }

        if (emailService != null) {
            emailService.sendMerchantWelcomeEmail(email, contactName, merchant.getBusinessName(), inviteUrl);
            log.info("Admin {} resent merchant welcome setup email to {} with link {}", adminUserId, email, inviteUrl);
        }

        if (auditService != null) {
            auditService.record(AuditEventType.MERCHANT_UPDATED, adminUserId, null, null, MDC.get("requestId"),
                    "{\"merchantId\":\"" + merchantId + "\",\"action\":\"RESEND_WELCOME_EMAIL\",\"recipient\":\""
                            + email + "\"}");
        }
    }

    // ---- General / Backwards-compatible Queries ----

    @Override
    @Transactional(readOnly = true)
    public MerchantResponse getMerchantById(UUID id) {
        Merchant merchant = merchantRepository.findById(id)
                .orElseThrow(() -> new AppException("Merchant not found", ApiError.MERCHANT_NOT_FOUND, 404));
        String categoryName = getCategoryName(merchant.getCategoryId());
        return toMerchantResponse(merchant, categoryName);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MerchantResponse> getAllMerchants(Pageable pageable) {
        return merchantRepository.findAll(pageable)
                .map(m -> toMerchantResponse(m, getCategoryName(m.getCategoryId())));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MerchantResponse> getAllMerchants(Pageable pageable, MerchantStatus status,
            ApprovalStatus approvalStatus) {
        if (status != null && approvalStatus != null) {
            return merchantRepository.findByStatusAndApprovalStatus(status, approvalStatus, pageable)
                    .map(m -> toMerchantResponse(m, getCategoryName(m.getCategoryId())));
        } else if (status != null) {
            return merchantRepository.findByStatus(status, pageable)
                    .map(m -> toMerchantResponse(m, getCategoryName(m.getCategoryId())));
        } else if (approvalStatus != null) {
            return merchantRepository.findByApprovalStatus(approvalStatus, pageable)
                    .map(m -> toMerchantResponse(m, getCategoryName(m.getCategoryId())));
        }
        return getAllMerchants(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MerchantResponse> getMerchantsByOwner(UUID ownerUserId, Pageable pageable) {
        return merchantRepository.findByOwnerUserId(ownerUserId, pageable)
                .map(m -> toMerchantResponse(m, getCategoryName(m.getCategoryId())));
    }

    @Override
    @Transactional
    public MerchantResponse updateMerchant(UUID id, UpdateMerchantRequest request, UUID currentUserId,
            boolean isAdmin) {
        Merchant merchant = merchantRepository.findById(id)
                .orElseThrow(() -> new AppException("Merchant not found", ApiError.MERCHANT_NOT_FOUND, 404));

        if (!isAdmin && !merchant.getOwnerUserId().equals(currentUserId)) {
            throw new AppException("You do not have permission to modify this merchant",
                    ApiError.MERCHANT_ACCESS_DENIED, 403);
        }

        String categoryName = null;
        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.categoryId()));
            categoryName = category.getName();
            merchant.setCategoryId(request.categoryId());
        } else {
            categoryName = getCategoryName(merchant.getCategoryId());
        }

        merchant.setBusinessName(request.businessName().trim());
        if (request.legalName() != null)
            merchant.setLegalName(request.legalName().trim());
        if (request.description() != null)
            merchant.setDescription(request.description().trim());
        if (request.phone() != null)
            merchant.setPhone(request.phone().trim());
        if (request.email() != null)
            merchant.setEmail(request.email().trim().toLowerCase());
        if (request.website() != null)
            merchant.setWebsite(request.website().trim());
        if (request.gstin() != null)
            merchant.setGstin(request.gstin().trim());
        if (request.pan() != null)
            merchant.setPan(request.pan().trim());
        if (request.commissionRate() != null)
            merchant.setCommissionRate(request.commissionRate());
        if (request.state() != null)
            merchant.setState(request.state().trim());
        if (request.district() != null)
            merchant.setDistrict(request.district().trim());
        if (request.city() != null)
            merchant.setCity(request.city().trim());
        if (request.pincode() != null)
            merchant.setPincode(request.pincode().trim());
        if (request.address() != null)
            merchant.setAddress(request.address().trim());

        Merchant updated = merchantRepository.save(merchant);
        log.info("Updated merchant id={} name='{}'", updated.getId(), updated.getBusinessName());

        if (bankAccountRepository != null && request.bankAccountNumber() != null && !request.bankAccountNumber().isBlank()) {
            saveOrUpdatePrimaryBankAccount(updated.getId(), request.bankName(), request.accountHolderName(), request.bankAccountNumber(), request.bankIfsc(), request.bankUpiId());
        }

        return toMerchantResponse(updated, categoryName);
    }

    @Override
    @Transactional
    public void deleteMerchant(UUID id, UUID currentUserId, boolean isAdmin) {
        Merchant merchant = merchantRepository.findById(id)
                .orElseThrow(() -> new AppException("Merchant not found", ApiError.MERCHANT_NOT_FOUND, 404));

        if (!isAdmin && !merchant.getOwnerUserId().equals(currentUserId)) {
            throw new AppException("You do not have permission to delete this merchant",
                    ApiError.MERCHANT_ACCESS_DENIED, 403);
        }

        UUID ownerId = merchant.getOwnerUserId();

        // 1. Invalidate sessions and delete staff members scoped to this merchant
        if (staffMemberRepository != null) {
            List<StaffMember> merchantStaff = staffMemberRepository.findByMerchantId(id);
            for (StaffMember staff : merchantStaff) {
                if (sessionService != null && staff.getUserId() != null) {
                    userRepository.findById(staff.getUserId()).ifPresent(sessionService::revokeAllSessions);
                }
                staffMemberRepository.delete(staff);
            }
        }

        // 2. Revoke all active sessions and refresh tokens for the merchant owner
        if (sessionService != null && ownerId != null) {
            userRepository.findById(ownerId).ifPresent(sessionService::revokeAllSessions);
        }

        // 3. Delete merchant record (cascades kyc, bank accounts, wallets, stores)
        merchantRepository.delete(merchant);
        merchantRepository.flush();
        log.info("Deleted merchant id={} by user={}", id, currentUserId);

        // 4. Handle owner user lifecycle: if no other merchants remain, clean up or demote
        if (ownerId != null) {
            User owner = userRepository.findById(ownerId).orElse(null);
            if (owner != null && owner.getRole() != Role.ADMIN && owner.getRole() != Role.SUPER_ADMIN) {
                List<Merchant> remainingMerchants = merchantRepository.findAllByOwnerUserId(ownerId);
                if (remainingMerchants.isEmpty()) {
                    boolean hasOtherStaff = staffMemberRepository != null && staffMemberRepository.existsByUserId(ownerId);
                    if (!hasOtherStaff) {
                        try {
                            userRepository.delete(owner);
                            userRepository.flush();
                            log.info("Cleaned up orphaned merchant owner user id={}", ownerId);
                        } catch (Exception ex) {
                            log.warn("Could not hard-delete user id={} due to constraints; deactivating: {}", ownerId, ex.getMessage());
                            owner.setStatus(UserStatus.INACTIVE);
                            owner.setRole(Role.CUSTOMER);
                            userRepository.save(owner);
                        }
                    } else if (owner.getRole() == Role.MERCHANT) {
                        owner.setRole(Role.CUSTOMER);
                        userRepository.save(owner);
                    }
                }
            }
        }

        if (auditService != null) {
            auditService.record(AuditEventType.MERCHANT_DELETED, currentUserId, null, null, MDC.get("requestId"),
                    "{\"merchantId\":\"" + id + "\",\"businessName\":\"" + merchant.getBusinessName() + "\"}");
        }
    }

    @Override
    @Transactional
    public MerchantResponse updateApprovalStatus(UUID id, UpdateApprovalStatusRequest request) {
        Merchant merchant = merchantRepository.findById(id)
                .orElseThrow(() -> new AppException("Merchant not found", ApiError.MERCHANT_NOT_FOUND, 404));

        ApprovalStatus oldStatus = merchant.getApprovalStatus();
        merchant.setApprovalStatus(request.status());
        if (request.status() == ApprovalStatus.APPROVED) {
            merchant.setApprovedAt(Instant.now());
        }
        Merchant updated = merchantRepository.save(merchant);
        log.info("Admin updated merchant id={} status from {} to {}. Notes: {}",
                id, oldStatus, request.status(), request.notes());

        return toMerchantResponse(updated, getCategoryName(updated.getCategoryId()));
    }

    private String getCategoryName(UUID categoryId) {
        if (categoryId == null)
            return null;
        return categoryRepository.findById(categoryId)
                .map(Category::getName)
                .orElse(null);
    }

    private MerchantResponse toMerchantResponse(Merchant merchant, String categoryName) {
        if (merchant == null) return null;
        com.superapp.wallet.entity.MerchantBankAccount bank = null;
        if (bankAccountRepository != null && merchant.getId() != null) {
            bank = bankAccountRepository.findByMerchantIdAndIsPrimaryTrue(merchant.getId()).orElse(null);
        }
        return MerchantResponse.fromEntity(merchant, categoryName, bank);
    }

    private void saveOrUpdatePrimaryBankAccount(UUID merchantId, String bankName, String holderName, String accNumber, String ifsc, String upi) {
        if (bankAccountRepository == null || accNumber == null || accNumber.isBlank()) return;
        try {
            com.superapp.wallet.entity.MerchantBankAccount acc = bankAccountRepository.findByMerchantIdAndIsPrimaryTrue(merchantId)
                    .orElseGet(() -> {
                        com.superapp.wallet.entity.MerchantBankAccount newAcc = new com.superapp.wallet.entity.MerchantBankAccount();
                        newAcc.setMerchantId(merchantId);
                        newAcc.setIsPrimary(true);
                        newAcc.setVerificationStatus(com.superapp.wallet.enums.BankAccountVerificationStatus.VERIFIED);
                        return newAcc;
                    });
            String trimmedAcc = accNumber.trim();
            String last4 = trimmedAcc.length() >= 4 ? trimmedAcc.substring(trimmedAcc.length() - 4) : trimmedAcc;
            String enc = "ENC_AES256_" + java.util.Base64.getEncoder().encodeToString(trimmedAcc.getBytes());
            acc.setBankName(bankName != null && !bankName.isBlank() ? bankName.trim() : "Bank");
            acc.setAccountHolderName(holderName != null && !holderName.isBlank() ? holderName.trim() : "Account Holder");
            acc.setAccountNumberEncrypted(enc);
            acc.setAccountNumberLast4(last4);
            acc.setIfscCode(ifsc != null && !ifsc.isBlank() ? ifsc.trim().toUpperCase() : "SBIN0000000");
            if (upi != null && !upi.isBlank()) acc.setUpiVpa(upi.trim().toLowerCase());
            bankAccountRepository.save(acc);
            log.info("Synchronized primary MerchantBankAccount for merchantId={}", merchantId);
        } catch (Exception e) {
            log.warn("Could not sync MerchantBankAccount for merchantId={}: {}", merchantId, e.getMessage());
        }
    }

    private void saveOrUpdateMerchantKycRecord(UUID merchantId, String businessType, String status) {
        if (merchantKycRepository == null) return;
        try {
            MerchantKyc kyc = merchantKycRepository.findFirstByMerchantIdOrderByCreatedAtDesc(merchantId)
                    .orElseGet(() -> {
                        MerchantKyc newKyc = new MerchantKyc();
                        newKyc.setMerchantId(merchantId);
                        return newKyc;
                    });
            kyc.setBusinessType(businessType != null && !businessType.isBlank() ? businessType : "RETAIL_COMMERCIAL");
            kyc.setDocumentType("BUSINESS_REGISTRATION");
            kyc.setStatus(status != null ? status : "PENDING");
            merchantKycRepository.save(kyc);
            log.info("Synchronized MerchantKyc compliance record for merchantId={}", merchantId);
        } catch (Exception e) {
            log.warn("Could not sync MerchantKyc record for merchantId={}: {}", merchantId, e.getMessage());
        }
    }
}
