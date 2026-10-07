package com.superapp.offer;

import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.AppException;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.common.response.ApiError;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.enums.MerchantStatus;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.offer.dto.*;
import com.superapp.offer.entity.Offer;
import com.superapp.offer.enums.OfferApprovalStatus;
import com.superapp.offer.enums.OfferStatus;
import com.superapp.offer.enums.OfferType;
import com.superapp.offer.mapper.OfferMapper;
import com.superapp.offer.repository.OfferRepository;
import com.superapp.offer.service.OfferServiceImpl;
import com.superapp.offer.validation.OfferValidator;
import com.superapp.store.entity.Store;
import com.superapp.store.enums.StoreStatus;
import com.superapp.store.repository.StoreRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.CacheManager;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OfferServiceTest {

    @Mock private OfferRepository offerRepository;
    @Mock private MerchantRepository merchantRepository;
    @Mock private StoreRepository storeRepository;
    @Mock private AuditService auditService;
    @Mock private CacheManager cacheManager;

    private OfferValidator offerValidator;
    private OfferMapper offerMapper;
    private OfferServiceImpl offerService;

    private UUID ownerUserId;
    private UUID merchantId;
    private UUID storeId;
    private UUID offerId;
    private Merchant merchant;
    private Store store;

    @BeforeEach
    void setUp() {
        offerValidator = new OfferValidator();
        offerMapper = new OfferMapper();
        offerService = new OfferServiceImpl(
                offerRepository,
                merchantRepository,
                storeRepository,
                offerValidator,
                offerMapper,
                auditService,
                cacheManager
        );

        ownerUserId = UUID.randomUUID();
        merchantId = UUID.randomUUID();
        storeId = UUID.randomUUID();
        offerId = UUID.randomUUID();

        merchant = new Merchant();
        merchant.setId(merchantId);
        merchant.setOwnerUserId(ownerUserId);
        merchant.setBusinessName("Foodies Delight");
        merchant.setApprovalStatus(ApprovalStatus.APPROVED);
        merchant.setStatus(MerchantStatus.ACTIVE);

        store = new Store();
        store.setId(storeId);
        store.setMerchantId(merchantId);
        store.setStoreName("Foodies Main Branch");
        store.setApprovalStatus(ApprovalStatus.APPROVED);
        store.setStatus(StoreStatus.ACTIVE);
    }

    @Test
    @DisplayName("createMerchantOffer creates offer in DRAFT/CREATED state")
    void createMerchantOffer_success() {
        when(merchantRepository.findByOwnerUserId(ownerUserId)).thenReturn(Optional.of(merchant));
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(offerRepository.save(any(Offer.class))).thenAnswer(invocation -> {
            Offer o = invocation.getArgument(0);
            o.setId(offerId);
            return o;
        });

        CreateOfferRequest request = new CreateOfferRequest(
                storeId,
                "10% Cashback",
                "Eligible for dining",
                OfferType.CASHBACK,
                BigDecimal.valueOf(10),
                BigDecimal.valueOf(500),
                BigDecimal.valueOf(500),
                1000,
                1,
                Instant.now(),
                Instant.now().plus(30, ChronoUnit.DAYS)
        );

        MerchantOfferResponse response = offerService.createMerchantOffer(request, ownerUserId);

        assertNotNull(response);
        assertEquals(offerId.toString(), response.id());
        assertEquals("10% Cashback", response.title());
        assertEquals("CREATED", response.status());
        assertEquals("DRAFT", response.approvalStatus());
        assertEquals(merchantId.toString(), response.merchantId());
        assertEquals(storeId.toString(), response.storeId());
        assertEquals("Foodies Main Branch", response.storeName());
    }

    @Test
    @DisplayName("createMerchantOffer for another merchant's store throws OFFER_ACCESS_DENIED")
    void createMerchantOffer_crossMerchantStore_throwsOfferAccessDenied() {
        Store otherStore = new Store();
        otherStore.setId(storeId);
        otherStore.setMerchantId(UUID.randomUUID()); // Different merchant!
        otherStore.setApprovalStatus(ApprovalStatus.APPROVED);
        otherStore.setStatus(StoreStatus.ACTIVE);

        when(merchantRepository.findByOwnerUserId(ownerUserId)).thenReturn(Optional.of(merchant));
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(otherStore));

        CreateOfferRequest request = new CreateOfferRequest(
                storeId,
                "10% Cashback",
                "Eligible for dining",
                OfferType.CASHBACK,
                BigDecimal.valueOf(10),
                BigDecimal.valueOf(500),
                BigDecimal.valueOf(500),
                1000,
                1,
                Instant.now(),
                Instant.now().plus(30, ChronoUnit.DAYS)
        );

        AppException ex = assertThrows(AppException.class,
                () -> offerService.createMerchantOffer(request, ownerUserId));
        assertEquals(ApiError.OFFER_ACCESS_DENIED, ex.getErrorCode());
        assertEquals(403, ex.getHttpStatus());
    }

    @Test
    @DisplayName("createMerchantOffer for unapproved store throws STORE_NOT_ELIGIBLE")
    void createMerchantOffer_unapprovedStore_throwsStoreNotEligible() {
        store.setApprovalStatus(ApprovalStatus.PENDING);

        when(merchantRepository.findByOwnerUserId(ownerUserId)).thenReturn(Optional.of(merchant));
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));

        CreateOfferRequest request = new CreateOfferRequest(
                storeId,
                "10% Cashback",
                "Eligible for dining",
                OfferType.CASHBACK,
                BigDecimal.valueOf(10),
                BigDecimal.valueOf(500),
                BigDecimal.valueOf(500),
                1000,
                1,
                Instant.now(),
                Instant.now().plus(30, ChronoUnit.DAYS)
        );

        AppException ex = assertThrows(AppException.class,
                () -> offerService.createMerchantOffer(request, ownerUserId));
        assertEquals(ApiError.STORE_NOT_ELIGIBLE, ex.getErrorCode());
        assertEquals(400, ex.getHttpStatus());
    }

    @Test
    @DisplayName("getMerchantOfferById for another merchant throws OFFER_ACCESS_DENIED")
    void getMerchantOfferById_crossMerchant_throwsOfferAccessDenied() {
        Offer otherOffer = new Offer();
        otherOffer.setId(offerId);
        otherOffer.setMerchantId(UUID.randomUUID()); // Different merchant!

        when(merchantRepository.findByOwnerUserId(ownerUserId)).thenReturn(Optional.of(merchant));
        when(offerRepository.findById(offerId)).thenReturn(Optional.of(otherOffer));

        AppException ex = assertThrows(AppException.class,
                () -> offerService.getMerchantOfferById(offerId, ownerUserId));
        assertEquals(ApiError.OFFER_ACCESS_DENIED, ex.getErrorCode());
        assertEquals(403, ex.getHttpStatus());
    }

    @Test
    @DisplayName("updateMerchantOffer resets approval status to DRAFT if previously approved")
    void updateMerchantOffer_resetsApprovalToDraft() {
        Offer approvedOffer = new Offer();
        approvedOffer.setId(offerId);
        approvedOffer.setMerchantId(merchantId);
        approvedOffer.setStoreId(storeId);
        approvedOffer.setTitle("Old Title");
        approvedOffer.setType(OfferType.CASHBACK);
        approvedOffer.setValue(BigDecimal.valueOf(10));
        approvedOffer.setStatus(OfferStatus.ACTIVE);
        approvedOffer.setApprovalStatus(OfferApprovalStatus.APPROVED);
        approvedOffer.setValidFrom(Instant.now());
        approvedOffer.setValidTo(Instant.now().plus(10, ChronoUnit.DAYS));

        when(merchantRepository.findByOwnerUserId(ownerUserId)).thenReturn(Optional.of(merchant));
        when(offerRepository.findById(offerId)).thenReturn(Optional.of(approvedOffer));
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(offerRepository.save(any(Offer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateOfferRequest updateReq = new UpdateOfferRequest(
                storeId,
                "Updated 15% Cashback",
                "New description",
                OfferType.CASHBACK,
                BigDecimal.valueOf(15),
                BigDecimal.valueOf(500),
                BigDecimal.valueOf(750),
                1000,
                1,
                Instant.now(),
                Instant.now().plus(30, ChronoUnit.DAYS)
        );

        MerchantOfferResponse response = offerService.updateMerchantOffer(offerId, updateReq, ownerUserId);

        assertEquals("DRAFT", response.approvalStatus());
        assertEquals("CREATED", response.status());
        assertEquals("Updated 15% Cashback", response.title());
        assertEquals(BigDecimal.valueOf(15), response.value());
    }

    @Test
    @DisplayName("submitOfferForApproval transitions state to PENDING_APPROVAL")
    void submitOfferForApproval_success() {
        Offer draftOffer = new Offer();
        draftOffer.setId(offerId);
        draftOffer.setMerchantId(merchantId);
        draftOffer.setStoreId(storeId);
        draftOffer.setTitle("Draft Offer");
        draftOffer.setType(OfferType.CASHBACK);
        draftOffer.setValue(BigDecimal.valueOf(10));
        draftOffer.setStatus(OfferStatus.CREATED);
        draftOffer.setApprovalStatus(OfferApprovalStatus.DRAFT);
        draftOffer.setValidFrom(Instant.now());
        draftOffer.setValidTo(Instant.now().plus(10, ChronoUnit.DAYS));

        when(merchantRepository.findByOwnerUserId(ownerUserId)).thenReturn(Optional.of(merchant));
        when(offerRepository.findById(offerId)).thenReturn(Optional.of(draftOffer));
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(offerRepository.save(any(Offer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OfferApprovalResponse response = offerService.submitOfferForApproval(offerId, ownerUserId);

        assertEquals(offerId.toString(), response.offerId());
        assertEquals("PENDING_APPROVAL", response.approvalStatus());
    }

    @Test
    @DisplayName("approveOffer by admin sets APPROVED and ACTIVE")
    void approveOffer_success() {
        UUID adminId = UUID.randomUUID();
        Offer pendingOffer = new Offer();
        pendingOffer.setId(offerId);
        pendingOffer.setMerchantId(merchantId);
        pendingOffer.setStoreId(storeId);
        pendingOffer.setApprovalStatus(OfferApprovalStatus.PENDING_APPROVAL);
        pendingOffer.setStatus(OfferStatus.PENDING_APPROVAL);
        pendingOffer.setValidFrom(Instant.now());
        pendingOffer.setValidTo(Instant.now().plus(10, ChronoUnit.DAYS));

        when(offerRepository.findById(offerId)).thenReturn(Optional.of(pendingOffer));
        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(offerRepository.save(any(Offer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OfferApprovalResponse response = offerService.approveOffer(offerId, adminId);

        assertEquals("APPROVED", response.approvalStatus());
        assertEquals("ACTIVE", response.status());
    }

    @Test
    @DisplayName("rejectOffer by admin sets REJECTED with reason")
    void rejectOffer_success() {
        UUID adminId = UUID.randomUUID();
        Offer pendingOffer = new Offer();
        pendingOffer.setId(offerId);
        pendingOffer.setApprovalStatus(OfferApprovalStatus.PENDING_APPROVAL);
        pendingOffer.setStatus(OfferStatus.PENDING_APPROVAL);

        when(offerRepository.findById(offerId)).thenReturn(Optional.of(pendingOffer));
        when(offerRepository.save(any(Offer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RejectOfferRequest rejectReq = new RejectOfferRequest("Terms and conditions are unclear");
        OfferApprovalResponse response = offerService.rejectOffer(offerId, rejectReq, adminId);

        assertEquals("REJECTED", response.approvalStatus());
        assertEquals("Terms and conditions are unclear", response.reason());
    }

    @Test
    @DisplayName("getCustomerOfferDetails returns active approved offer with nested store and merchant")
    void getCustomerOfferDetails_success() {
        Offer activeOffer = new Offer();
        activeOffer.setId(offerId);
        activeOffer.setMerchantId(merchantId);
        activeOffer.setStoreId(storeId);
        activeOffer.setTitle("10% Cashback");
        activeOffer.setType(OfferType.CASHBACK);
        activeOffer.setValue(BigDecimal.valueOf(10));
        activeOffer.setStatus(OfferStatus.ACTIVE);
        activeOffer.setApprovalStatus(OfferApprovalStatus.APPROVED);
        activeOffer.setValidFrom(Instant.now().minus(1, ChronoUnit.DAYS));
        activeOffer.setValidTo(Instant.now().plus(10, ChronoUnit.DAYS));

        when(offerRepository.findById(offerId)).thenReturn(Optional.of(activeOffer));
        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));

        CustomerOfferDetailResponse response = offerService.getCustomerOfferDetails(offerId);

        assertNotNull(response);
        assertEquals(offerId.toString(), response.id());
        assertEquals("10% Cashback", response.title());
        assertEquals("Foodies Delight", response.merchant().name());
        assertEquals("Foodies Main Branch", response.store().name());
    }

    @Test
    @DisplayName("getCustomerOfferDetails throws OFFER_NOT_FOUND if unapproved or expired")
    void getCustomerOfferDetails_unapproved_throwsOfferNotFound() {
        Offer draftOffer = new Offer();
        draftOffer.setId(offerId);
        draftOffer.setApprovalStatus(OfferApprovalStatus.DRAFT);
        draftOffer.setStatus(OfferStatus.CREATED);

        when(offerRepository.findById(offerId)).thenReturn(Optional.of(draftOffer));

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> offerService.getCustomerOfferDetails(offerId));
        assertEquals(ApiError.OFFER_NOT_FOUND, ex.getErrorCode());
    }
}
