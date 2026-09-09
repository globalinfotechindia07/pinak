package com.superapp.merchant.service;

import com.superapp.category.entity.Category;
import com.superapp.category.repository.CategoryRepository;
import com.superapp.common.exception.AppException;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.common.response.ApiError;
import com.superapp.merchant.dto.CreateMerchantRequest;
import com.superapp.merchant.dto.MerchantResponse;
import com.superapp.merchant.dto.UpdateApprovalStatusRequest;
import com.superapp.merchant.dto.UpdateMerchantRequest;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class MerchantServiceImpl implements MerchantService {

    private static final Logger log = LoggerFactory.getLogger(MerchantServiceImpl.class);

    private final MerchantRepository merchantRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public MerchantServiceImpl(
            MerchantRepository merchantRepository,
            CategoryRepository categoryRepository,
            UserRepository userRepository
    ) {
        this.merchantRepository = merchantRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public MerchantResponse createMerchant(CreateMerchantRequest request, UUID currentUserId, boolean isAdmin) {
        UUID ownerId = currentUserId;
        if (isAdmin && request.ownerUserId() != null) {
            ownerId = request.ownerUserId();
        }

        // Validate owner exists
        if (!userRepository.existsById(ownerId)) {
            throw new ResourceNotFoundException("User (owner)", "id", ownerId);
        }

        // Validate category if provided
        String categoryName = null;
        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.categoryId()));
            categoryName = category.getName();
        }

        Merchant merchant = new Merchant(ownerId, request.businessName().trim(), request.categoryId());
        Merchant saved = merchantRepository.save(merchant);
        log.info("Created merchant id={} name='{}' ownerId={}", saved.getId(), saved.getBusinessName(), ownerId);

        return MerchantResponse.fromEntity(saved, categoryName);
    }

    @Override
    @Transactional(readOnly = true)
    public MerchantResponse getMerchantById(UUID id) {
        Merchant merchant = merchantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Merchant", "id", id));
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
    public Page<MerchantResponse> getMerchantsByOwner(UUID ownerUserId, Pageable pageable) {
        return merchantRepository.findByOwnerUserId(ownerUserId, pageable)
                .map(m -> MerchantResponse.fromEntity(m, getCategoryName(m.getCategoryId())));
    }

    @Override
    @Transactional
    public MerchantResponse updateMerchant(UUID id, UpdateMerchantRequest request, UUID currentUserId, boolean isAdmin) {
        Merchant merchant = merchantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Merchant", "id", id));

        if (!isAdmin && !merchant.getOwnerUserId().equals(currentUserId)) {
            throw new AppException("You do not have permission to modify this merchant", ApiError.FORBIDDEN, 403);
        }

        if (request.categoryId() != null) {
            categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.categoryId()));
            merchant.setCategoryId(request.categoryId());
        }

        merchant.setBusinessName(request.businessName().trim());
        Merchant updated = merchantRepository.save(merchant);
        log.info("Updated merchant id={} name='{}'", updated.getId(), updated.getBusinessName());

        return MerchantResponse.fromEntity(updated, getCategoryName(updated.getCategoryId()));
    }

    @Override
    @Transactional
    public void deleteMerchant(UUID id, UUID currentUserId, boolean isAdmin) {
        Merchant merchant = merchantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Merchant", "id", id));

        if (!isAdmin && !merchant.getOwnerUserId().equals(currentUserId)) {
            throw new AppException("You do not have permission to delete this merchant", ApiError.FORBIDDEN, 403);
        }

        merchantRepository.delete(merchant);
        log.info("Deleted merchant id={} by user={}", id, currentUserId);
    }

    @Override
    @Transactional
    public MerchantResponse updateApprovalStatus(UUID id, UpdateApprovalStatusRequest request) {
        Merchant merchant = merchantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Merchant", "id", id));

        ApprovalStatus oldStatus = merchant.getStatus();
        merchant.setStatus(request.status());
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
