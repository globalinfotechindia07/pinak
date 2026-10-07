package com.superapp.user.service;

import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.enums.MerchantStatus;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.offer.enums.OfferApprovalStatus;
import com.superapp.offer.enums.OfferStatus;
import com.superapp.offer.repository.OfferRepository;
import com.superapp.store.enums.StoreStatus;
import com.superapp.store.repository.StoreRepository;
import com.superapp.transaction.transaction.enums.TransactionStatus;
import com.superapp.transaction.transaction.repository.TransactionRepository;
import com.superapp.user.dto.UserDTO;
import com.superapp.user.dto.UserDTO.AdminDashboardSummaryResponse;
import com.superapp.user.dto.UserDTO.AdminDashboardSummaryResponse.*;
import com.superapp.user.entity.UserStatus;
import com.superapp.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final UserRepository userRepository;
    private final MerchantRepository merchantRepository;
    private final StoreRepository storeRepository;
    private final OfferRepository offerRepository;
    private final TransactionRepository transactionRepository;

    public AdminDashboardServiceImpl(
            UserRepository userRepository,
            MerchantRepository merchantRepository,
            StoreRepository storeRepository,
            OfferRepository offerRepository,
            TransactionRepository transactionRepository) {
        this.userRepository = userRepository;
        this.merchantRepository = merchantRepository;
        this.storeRepository = storeRepository;
        this.offerRepository = offerRepository;
        this.transactionRepository = transactionRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDTO.AdminDashboardSummaryResponse getDashboardSummary() {
        // Users
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByStatus(UserStatus.ACTIVE);
        long inactiveUsers = userRepository.countByStatus(UserStatus.INACTIVE);
        UserMetrics userMetrics = new UserMetrics(totalUsers, activeUsers, inactiveUsers);

        // Merchants
        long totalMerchants = merchantRepository.count();
        long pendingApprovalMerchants = merchantRepository.countByApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        long activeMerchants = merchantRepository.countByStatus(MerchantStatus.ACTIVE);
        long suspendedMerchants = merchantRepository.countByStatus(MerchantStatus.SUSPENDED);
        MerchantMetrics merchantMetrics = new MerchantMetrics(totalMerchants, pendingApprovalMerchants, activeMerchants, suspendedMerchants);

        // Stores
        long totalStores = storeRepository.count();
        long pendingApprovalStores = storeRepository.countByApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        long activeStores = storeRepository.countByStatus(StoreStatus.ACTIVE);
        StoreMetrics storeMetrics = new StoreMetrics(totalStores, pendingApprovalStores, activeStores);

        // Offers
        long totalOffers = offerRepository.count();
        long pendingApprovalOffers = offerRepository.countByApprovalStatus(OfferApprovalStatus.PENDING_APPROVAL);
        long activeOffers = offerRepository.countByStatus(OfferStatus.ACTIVE);
        long expiredOffers = offerRepository.countByStatus(OfferStatus.EXPIRED);
        OfferMetrics offerMetrics = new OfferMetrics(totalOffers, pendingApprovalOffers, activeOffers, expiredOffers);

        // Transactions
        long totalTransactions = transactionRepository.count();
        long successfulTransactions = transactionRepository.countByStatus(TransactionStatus.SUCCESS);
        long pendingTransactions = transactionRepository.countByStatus(TransactionStatus.PENDING);
        long failedTransactions = transactionRepository.countByStatus(TransactionStatus.FAILED);
        long refundedTransactions = transactionRepository.countByStatus(TransactionStatus.REFUNDED);
        TransactionMetrics transactionMetrics = new TransactionMetrics(
                totalTransactions, successfulTransactions, pendingTransactions, failedTransactions, refundedTransactions);

        return new AdminDashboardSummaryResponse(
                userMetrics,
                merchantMetrics,
                storeMetrics,
                offerMetrics,
                transactionMetrics,
                Instant.now()
        );
    }
}
