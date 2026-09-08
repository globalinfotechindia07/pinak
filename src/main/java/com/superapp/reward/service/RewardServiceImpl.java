package com.superapp.reward.service;

import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.reward.dto.EarnRewardRequest;
import com.superapp.reward.dto.RedeemRewardRequest;
import com.superapp.reward.dto.RewardAccountResponse;
import com.superapp.reward.dto.RewardTransactionResponse;
import com.superapp.reward.entity.RewardAccount;
import com.superapp.reward.entity.RewardAccountStatus;
import com.superapp.reward.entity.RewardTransaction;
import com.superapp.reward.entity.RewardTransactionType;
import com.superapp.reward.mapper.RewardMapper;
import com.superapp.reward.repository.RewardAccountRepository;
import com.superapp.reward.repository.RewardTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class RewardServiceImpl implements RewardService {

    private static final Logger log = LoggerFactory.getLogger(RewardServiceImpl.class);

    private final RewardAccountRepository rewardAccountRepository;
    private final RewardTransactionRepository rewardTransactionRepository;
    private final RewardMapper rewardMapper;

    public RewardServiceImpl(
            RewardAccountRepository rewardAccountRepository,
            RewardTransactionRepository rewardTransactionRepository,
            RewardMapper rewardMapper
    ) {
        this.rewardAccountRepository = rewardAccountRepository;
        this.rewardTransactionRepository = rewardTransactionRepository;
        this.rewardMapper = rewardMapper;
    }

    @Override
    @Transactional
    public RewardAccount getOrCreateAccount(UUID customerId) {
        return rewardAccountRepository.findByCustomerId(customerId)
                .orElseGet(() -> rewardAccountRepository.save(new RewardAccount(customerId)));
    }

    @Override
    @Transactional(readOnly = true)
    public RewardAccountResponse getAccountResponse(UUID customerId) {
        RewardAccount account = rewardAccountRepository.findByCustomerId(customerId)
                .orElseGet(() -> new RewardAccount(customerId));
        return rewardMapper.toResponse(account);
    }

    @Override
    @Transactional
    public RewardTransactionResponse earnPoints(EarnRewardRequest request) {
        RewardAccount account = getOrCreateAccount(request.customerId());

        if (account.getStatus() != RewardAccountStatus.ACTIVE) {
            throw new AppException("Reward account is not active", ApiError.ACCOUNT_INACTIVE, 400);
        }

        long newBalance = account.getPointsBalance() + request.points();
        account.setPointsBalance(newBalance);
        account.setLifetimeEarned(account.getLifetimeEarned() + request.points());
        rewardAccountRepository.save(account);

        RewardTransaction tx = new RewardTransaction(
                account.getId(),
                request.points(),
                RewardTransactionType.EARNED,
                request.referenceType(),
                request.referenceId(),
                request.description()
        );
        RewardTransaction savedTx = rewardTransactionRepository.save(tx);

        log.info("Credited {} points to customer={} newBalance={}", request.points(), request.customerId(), newBalance);
        return rewardMapper.toResponse(savedTx);
    }

    @Override
    @Transactional
    public RewardTransactionResponse redeemPoints(RedeemRewardRequest request) {
        RewardAccount account = getOrCreateAccount(request.customerId());

        if (account.getStatus() != RewardAccountStatus.ACTIVE) {
            throw new AppException("Reward account is not active", ApiError.ACCOUNT_INACTIVE, 400);
        }

        if (account.getPointsBalance() < request.points()) {
            throw new AppException(
                    "Insufficient reward points. Current balance: " + account.getPointsBalance() + ", Requested: " + request.points(),
                    ApiError.VALIDATION_FAILED,
                    400
            );
        }

        long newBalance = account.getPointsBalance() - request.points();
        account.setPointsBalance(newBalance);
        account.setLifetimeRedeemed(account.getLifetimeRedeemed() + request.points());
        rewardAccountRepository.save(account);

        RewardTransaction tx = new RewardTransaction(
                account.getId(),
                request.points(),
                RewardTransactionType.REDEEMED,
                request.referenceType(),
                request.referenceId(),
                request.description()
        );
        RewardTransaction savedTx = rewardTransactionRepository.save(tx);

        log.info("Redeemed {} points for customer={} newBalance={}", request.points(), request.customerId(), newBalance);
        return rewardMapper.toResponse(savedTx);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RewardTransactionResponse> getHistory(UUID customerId, Pageable pageable) {
        RewardAccount account = getOrCreateAccount(customerId);
        return rewardTransactionRepository.findByRewardAccountId(account.getId(), pageable)
                .map(rewardMapper::toResponse);
    }
}
