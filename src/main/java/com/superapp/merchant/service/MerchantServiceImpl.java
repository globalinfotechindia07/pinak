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
import java.util.Optional;
import java.util.UUID;

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

    @Autowired
    public MerchantServiceImpl(
            MerchantRepository merchantRepository,
            CategoryRepository categoryRepository,
            UserRepository userRepository,
            MerchantKycRepository merchantKycRepository,
            AuditService auditService,
            MerchantMapper merchantMapper,
            @Autowired(required = false) PasswordEncoder passwordEncoder
    ) {
        this.merchantRepository = merchantRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.merchantKycRepository = merchantKycRepository;
        this.auditService = auditService;
        this.merchantMapper = merchantMapper != null ? merchantMapper : new MerchantMapper();
        this.passwordEncoder = passwordEncoder;
    }

    // Overloaded constructor for backward compatibility with existing unit tests
    public MerchantServiceImpl(
            MerchantRepository merchantRepository,
            CategoryRepository categoryRepository,
            UserRepository userRepository
    ) {
        this(merchantRepository, categoryRepository, userRepository, null, null, new MerchantMapper(), null);
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
                throw new AppException("A merchant is already registered with email: " + email, ApiError.EMAIL_ALREADY_EXISTS, 400);
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
                            "Role Conflict: Email '" + email + "' belongs to an internal platform administrator. " +
                            "Platform staff cannot be registered as commercial merchant owners. Please provide a distinct commercial email.",
                            ApiError.VALIDATION_FAILED, 400
                    );
                }
                if (u.getRole() == Role.CUSTOMER) {
                    u.setRole(Role.MERCHANT);
                    userRepository.save(u);
                }
                ownerId = u.getId();
            } else {
                String fullName = (legalName != null && !legalName.isBlank()) ? legalName : request.businessName().trim();
                String[] parts = fullName.split("\\s+", 2);
                String fName = parts[0];
                String lName = parts.length > 1 ? parts[1] : "Owner";
                String pwdHash = passwordEncoder != null ? passwordEncoder.encode("Merchant@123") : "$2a$10$w8.3b04J0n0W6wG6eYgPZe9q3g3C9iYy1U2m7m9wK4jE5bH5c2F7O";
                User newOwner = new User(email, fullName, fName, lName, pwdHash, Role.MERCHANT);
                if (phone != null && !phone.isBlank()) {
                    newOwner.setMobile(phone);
                }
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
                    .orElseGet(() -> categoryRepository.findAll().stream().filter(Category::isActive).findFirst().orElse(null));
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
                website
        );

        if (isAdmin) {
            merchant.setStatus(MerchantStatus.ACTIVE);
            merchant.setApprovalStatus(ApprovalStatus.APPROVED);
            merchant.setKycStatus(KycStatus.VERIFIED);
            merchant.setApprovedAt(Instant.now());
            merchant.setCreatedBy("ADMIN");
        }

        Merchant saved = merchantRepository.save(merchant);
        log.info("Created merchant id={} name='{}' ownerId={} (isAdmin={})", saved.getId(), saved.getBusinessName(), ownerId, isAdmin);

        if (auditService != null) {
            auditService.record(AuditEventType.MERCHANT_CREATED, ownerId, null, null, MDC.get("requestId"),
                    "{\"merchantId\":\"" + saved.getId() + "\",\"businessName\":\"" + saved.getBusinessName() + "\"}");
        }

        return MerchantResponse.fromEntity(saved, categoryName);
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
            throw new AppException("You do not have permission to access this merchant", ApiError.MERCHANT_ACCESS_DENIED, 403);
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
        if (request.legalName() != null) merchant.setLegalName(request.legalName().trim());
        if (request.description() != null) merchant.setDescription(request.description().trim());
        if (request.phone() != null) merchant.setPhone(request.phone().trim());
        if (request.email() != null) merchant.setEmail(request.email().trim().toLowerCase());
        if (request.website() != null) merchant.setWebsite(request.website().trim());

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
                request.taxId() != null ? request.taxId().trim() : null,
                request.documentUrl() != null ? request.documentUrl().trim() : null
        );

        MerchantKyc savedKyc = merchantKycRepository != null ? merchantKycRepository.save(kyc) : kyc;

        merchant.setKycStatus(KycStatus.PENDING);
        if (merchant.getApprovalStatus() == ApprovalStatus.DRAFT) {
            merchant.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        }
        merchantRepository.save(merchant);

        log.info("KYC submitted for merchant id={} docType={}", merchant.getId(), request.documentType());

        if (auditService != null) {
            auditService.record(AuditEventType.MERCHANT_KYC_SUBMITTED, currentUserId, null, null, MDC.get("requestId"),
                    "{\"merchantId\":\"" + merchant.getId() + "\",\"documentType\":\"" + request.documentType() + "\"}");
        }

        return new MerchantKycResponse(
                savedKyc.getId(),
                merchant.getId(),
                savedKyc.getDocumentType(),
                savedKyc.getStatus(),
                savedKyc.getCreatedAt()
        );
    }

    @Override
    @Transactional
    public MerchantApprovalActionResponse approveMerchant(UUID merchantId, UUID adminUserId) {
        Merchant merchant = merchantRepository.findById(merchantId)
                .orElseThrow(() -> new AppException("Merchant not found", ApiError.MERCHANT_NOT_FOUND, 404));

        // State transition check: cannot approve if already APPROVED or not in pending/draft/rejected state
        if (merchant.getApprovalStatus() == ApprovalStatus.APPROVED) {
            throw new AppException("Merchant cannot be approved in its current state", ApiError.INVALID_MERCHANT_STATE, 409);
        }

        merchant.setApprovalStatus(ApprovalStatus.APPROVED);
        merchant.setApprovedAt(Instant.now());
        merchant.setKycStatus(KycStatus.VERIFIED);
        merchant.setUpdatedBy(adminUserId != null ? adminUserId.toString() : "ADMIN");
        merchantRepository.save(merchant);

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

        if (merchant.getApprovalStatus() == ApprovalStatus.APPROVED) {
            throw new AppException("Merchant cannot be approved in its current state", ApiError.INVALID_MERCHANT_STATE, 409);
        }

        merchant.setApprovalStatus(ApprovalStatus.REJECTED);
        merchant.setRejectionReason(reason.trim());
        merchant.setKycStatus(KycStatus.REJECTED);
        merchant.setUpdatedBy(adminUserId != null ? adminUserId.toString() : "ADMIN");
        merchantRepository.save(merchant);

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
                    "{\"merchantId\":\"" + merchantId + "\",\"action\":\"ACTIVATE\",\"reason\":\"" + (reason != null ? reason : "") + "\"}");
        }

        return MerchantApprovalActionResponse.approved(merchantId.toString());
    }

    // ---- General / Backwards-compatible Queries ----

    @Override
    @Transactional(readOnly = true)
    public MerchantResponse getMerchantById(UUID id) {
        Merchant merchant = merchantRepository.findById(id)
                .orElseThrow(() -> new AppException("Merchant not found", ApiError.MERCHANT_NOT_FOUND, 404));
        String categoryName = getCategoryName(merchant.getCategoryId());
        return MerchantResponse.fromEntity(merchant, categoryName);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MerchantResponse> getAllMerchants(Pageable pageable) {
        return merchantRepository.findAll(pageable)
                .map(m -> MerchantResponse.fromEntity(m, getCategoryName(m.getCategoryId())));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MerchantResponse> getAllMerchants(Pageable pageable, MerchantStatus status, ApprovalStatus approvalStatus) {
        if (status != null && approvalStatus != null) {
            return merchantRepository.findByStatusAndApprovalStatus(status, approvalStatus, pageable)
                    .map(m -> MerchantResponse.fromEntity(m, getCategoryName(m.getCategoryId())));
        } else if (status != null) {
            return merchantRepository.findByStatus(status, pageable)
                    .map(m -> MerchantResponse.fromEntity(m, getCategoryName(m.getCategoryId())));
        } else if (approvalStatus != null) {
            return merchantRepository.findByApprovalStatus(approvalStatus, pageable)
                    .map(m -> MerchantResponse.fromEntity(m, getCategoryName(m.getCategoryId())));
        }
        return getAllMerchants(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MerchantResponse> getMerchantsByOwner(UUID ownerUserId, Pageable pageable) {
        return merchantRepository.findByOwnerUserId(ownerUserId, pageable)
                .map(m -> MerchantResponse.fromEntity(m, getCategoryName(m.getCategoryId())));
    }

    @Override
    @Transactional
    public MerchantResponse updateMerchant(UUID id, UpdateMerchantRequest request, UUID currentUserId, boolean isAdmin) {
        Merchant merchant = merchantRepository.findById(id)
                .orElseThrow(() -> new AppException("Merchant not found", ApiError.MERCHANT_NOT_FOUND, 404));

        if (!isAdmin && !merchant.getOwnerUserId().equals(currentUserId)) {
            throw new AppException("You do not have permission to modify this merchant", ApiError.MERCHANT_ACCESS_DENIED, 403);
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
        if (request.legalName() != null) merchant.setLegalName(request.legalName().trim());
        if (request.description() != null) merchant.setDescription(request.description().trim());
        if (request.phone() != null) merchant.setPhone(request.phone().trim());
        if (request.email() != null) merchant.setEmail(request.email().trim().toLowerCase());
        if (request.website() != null) merchant.setWebsite(request.website().trim());

        Merchant updated = merchantRepository.save(merchant);
        log.info("Updated merchant id={} name='{}'", updated.getId(), updated.getBusinessName());

        return MerchantResponse.fromEntity(updated, categoryName);
    }

    @Override
    @Transactional
    public void deleteMerchant(UUID id, UUID currentUserId, boolean isAdmin) {
        Merchant merchant = merchantRepository.findById(id)
                .orElseThrow(() -> new AppException("Merchant not found", ApiError.MERCHANT_NOT_FOUND, 404));

        if (!isAdmin && !merchant.getOwnerUserId().equals(currentUserId)) {
            throw new AppException("You do not have permission to delete this merchant", ApiError.MERCHANT_ACCESS_DENIED, 403);
        }

        merchantRepository.delete(merchant);
        log.info("Deleted merchant id={} by user={}", id, currentUserId);
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

        return MerchantResponse.fromEntity(updated, getCategoryName(updated.getCategoryId()));
    }

    private String getCategoryName(UUID categoryId) {
        if (categoryId == null) return null;
        return categoryRepository.findById(categoryId)
                .map(Category::getName)
                .orElse(null);
    }
}
