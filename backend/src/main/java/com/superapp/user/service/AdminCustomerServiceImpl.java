package com.superapp.user.service;

import com.superapp.common.audit.AuditEventType;
import com.superapp.common.audit.AuditService;
import com.superapp.common.exception.DuplicateResourceException;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.mobile.booking.entity.TableBooking;
import com.superapp.mobile.booking.repository.TableBookingRepository;
import com.superapp.store.entity.Store;
import com.superapp.store.repository.StoreRepository;
import com.superapp.transaction.redemption.entity.Redemption;
import com.superapp.transaction.redemption.repository.RedemptionRepository;
import com.superapp.transaction.reward.dto.AdminRewardAdjustmentRequest;
import com.superapp.transaction.reward.dto.AdminRewardAdjustmentResponse;
import com.superapp.transaction.reward.dto.RewardBalanceResponse;
import com.superapp.transaction.reward.entity.RewardAccount;
import com.superapp.transaction.reward.enums.RewardLedgerType;
import com.superapp.transaction.reward.repository.RewardAccountRepository;
import com.superapp.transaction.reward.service.RewardService;
import com.superapp.transaction.transaction.entity.Transaction;
import com.superapp.transaction.transaction.enums.TransactionStatus;
import com.superapp.transaction.transaction.repository.TransactionRepository;
import com.superapp.user.dto.CustomerDtos.*;
import com.superapp.user.entity.Role;
import com.superapp.user.entity.User;
import com.superapp.user.entity.UserStatus;
import com.superapp.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminCustomerServiceImpl implements AdminCustomerService {

    private static final Logger log = LoggerFactory.getLogger(AdminCustomerServiceImpl.class);

    private final UserRepository userRepository;
    private final RewardAccountRepository rewardAccountRepository;
    private final RewardService rewardService;
    private final TransactionRepository transactionRepository;
    private final TableBookingRepository tableBookingRepository;
    private final StoreRepository storeRepository;
    private final AuditService auditService;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AdminCustomerServiceImpl(
            UserRepository userRepository,
            RewardAccountRepository rewardAccountRepository,
            RewardService rewardService,
            TransactionRepository transactionRepository,
            TableBookingRepository tableBookingRepository,
            StoreRepository storeRepository,
            @Autowired(required = false) AuditService auditService,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.rewardAccountRepository = rewardAccountRepository;
        this.rewardService = rewardService;
        this.transactionRepository = transactionRepository;
        this.tableBookingRepository = tableBookingRepository;
        this.storeRepository = storeRepository;
        this.auditService = auditService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CustomerDirectoryResponse> getCustomers(
            String search,
            String status,
            String segment,
            String city,
            Pageable pageable) {

        List<User> allCustomers = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.CUSTOMER)
                .collect(Collectors.toList());

        // 1. Text Search Filter
        if (search != null && !search.isBlank()) {
            String q = search.trim().toLowerCase();
            allCustomers = allCustomers.stream().filter(u -> {
                String name = u.getName() != null ? u.getName().toLowerCase() : "";
                String email = u.getEmail() != null ? u.getEmail().toLowerCase() : "";
                String phone = u.getPhone() != null ? u.getPhone() : "";
                String primaryCity = u.getPrimaryCity() != null ? u.getPrimaryCity().toLowerCase() : "";
                String ref = u.getReferralCode() != null ? u.getReferralCode().toLowerCase() : "";
                return name.contains(q) || email.contains(q) || phone.contains(q) || primaryCity.contains(q) || ref.contains(q);
            }).collect(Collectors.toList());
        }

        // 2. Status Filter
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            allCustomers = allCustomers.stream()
                    .filter(u -> u.getStatus() != null && u.getStatus().name().equalsIgnoreCase(status))
                    .collect(Collectors.toList());
        }

        // 3. City Filter
        if (city != null && !city.isBlank() && !"ALL".equalsIgnoreCase(city)) {
            allCustomers = allCustomers.stream()
                    .filter(u -> u.getPrimaryCity() != null && u.getPrimaryCity().equalsIgnoreCase(city))
                    .collect(Collectors.toList());
        }

        // 4. Map each customer to CustomerDirectoryResponse with real aggregate metrics
        List<CustomerDirectoryResponse> responses = allCustomers.stream()
                .map(this::mapToCustomerDirectoryResponse)
                .collect(Collectors.toList());

        // 5. Segment Filter
        if (segment != null && !segment.isBlank() && !"ALL".equalsIgnoreCase(segment)) {
            String segTarget = segment.trim().toLowerCase();
            responses = responses.stream().filter(c -> {
                String cSeg = c.segment() != null ? c.segment().toLowerCase() : "";
                if (segTarget.contains("power")) return cSeg.contains("power");
                if (segTarget.contains("reg")) return cSeg.contains("regular");
                if (segTarget.contains("new")) return cSeg.contains("new");
                return cSeg.contains(segTarget);
            }).collect(Collectors.toList());
        }

        // 6. Sorting
        if (pageable.getSort().isSorted()) {
            for (org.springframework.data.domain.Sort.Order order : pageable.getSort()) {
                Comparator<CustomerDirectoryResponse> comp = switch (order.getProperty().toLowerCase()) {
                    case "name" -> Comparator.comparing(c -> (c.name() != null ? c.name().toLowerCase() : ""));
                    case "visits" -> Comparator.comparing(CustomerDirectoryResponse::visits);
                    case "totalspend" -> Comparator.comparing(CustomerDirectoryResponse::totalSpend);
                    case "rewardsbalance" -> Comparator.comparing(CustomerDirectoryResponse::rewardsBalance);
                    case "city" -> Comparator.comparing(c -> (c.city() != null ? c.city().toLowerCase() : ""));
                    default -> Comparator.comparing(c -> (c.createdAt() != null ? c.createdAt() : Instant.EPOCH));
                };
                if (order.isDescending()) {
                    comp = comp.reversed();
                }
                responses.sort(comp);
            }
        } else {
            responses.sort(Comparator.comparing((CustomerDirectoryResponse c) -> c.createdAt() != null ? c.createdAt() : Instant.EPOCH).reversed());
        }

        // 7. Pagination slice
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), responses.size());
        List<CustomerDirectoryResponse> pagedList = start <= responses.size() ? responses.subList(start, end) : Collections.emptyList();

        return new PageImpl<>(pagedList, pageable, responses.size());
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerStatsResponse getCustomerStats() {
        List<User> customers = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.CUSTOMER)
                .collect(Collectors.toList());

        long totalCustomers = customers.size();
        long activeCustomers = customers.stream().filter(u -> u.getStatus() == UserStatus.ACTIVE).count();
        long suspendedCustomers = customers.stream().filter(u -> u.getStatus() == UserStatus.SUSPENDED).count();

        // Calculate power users & platform spend
        long powerUsers = 0;
        BigDecimal totalSpend = BigDecimal.ZERO;
        long totalCoins = 0;

        for (User u : customers) {
            CustomerDirectoryResponse r = mapToCustomerDirectoryResponse(u);
            if ("Power user".equalsIgnoreCase(r.segment())) {
                powerUsers++;
            }
            if (r.totalSpend() != null) {
                totalSpend = totalSpend.add(r.totalSpend());
            }
            totalCoins += r.rewardsBalance();
        }

        BigDecimal avgSpend = totalCustomers > 0
                ? totalSpend.divide(BigDecimal.valueOf(totalCustomers), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return new CustomerStatsResponse(
                totalCustomers,
                activeCustomers,
                suspendedCustomers,
                powerUsers,
                totalSpend,
                totalCoins,
                avgSpend
        );
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerDetailResponse getCustomerDetails(UUID customerId) {
        User user = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));

        CustomerDirectoryResponse profile = mapToCustomerDirectoryResponse(user);

        // Live Reward Wallet
        CustomerRewardSummary rewardWallet;
        try {
            RewardBalanceResponse bal = rewardService.getRewardBalance(customerId);
            int pts = bal.availableCoins() != null ? bal.availableCoins().intValue() : 0;
            int earned = bal.lifetimeEarned() != null ? bal.lifetimeEarned().multiply(BigDecimal.valueOf(10)).intValue() : pts;
            int redeemed = bal.lifetimeRedeemed() != null ? bal.lifetimeRedeemed().multiply(BigDecimal.valueOf(10)).intValue() : 0;
            String tier = profile.tier();
            double mult = "VIP".equalsIgnoreCase(tier) ? 2.0 : ("GOLD".equalsIgnoreCase(tier) ? 1.5 : ("SILVER".equalsIgnoreCase(tier) ? 1.2 : 1.0));
            BigDecimal cashEq = BigDecimal.valueOf(pts).multiply(BigDecimal.valueOf(0.10)).setScale(2, RoundingMode.HALF_UP);

            rewardWallet = new CustomerRewardSummary(
                    customerId,
                    pts,
                    earned,
                    redeemed,
                    tier,
                    cashEq,
                    mult,
                    "ACTIVE"
            );
        } catch (Exception ex) {
            rewardWallet = new CustomerRewardSummary(
                    customerId,
                    profile.rewardsBalance(),
                    profile.rewardsBalance() * 2,
                    0,
                    profile.tier(),
                    BigDecimal.valueOf(profile.rewardsBalance()).multiply(BigDecimal.valueOf(0.10)),
                    1.0,
                    user.getStatus().name()
            );
        }

        // Recent Transactions (Live from transactions table)
        List<CustomerTransactionSummary> recentTransactions = transactionRepository.findAll().stream()
                .filter(t -> user.getId().equals(t.getCustomerId()) || user.getId().equals(t.getUserId()))
                .sorted(Comparator.comparing((Transaction t) -> t.getCreatedAt() != null ? t.getCreatedAt() : Instant.EPOCH).reversed())
                .limit(10)
                .map(t -> {
                    String storeName = "PINAK Partner Store";
                    if (t.getStoreId() != null) {
                        storeName = storeRepository.findById(t.getStoreId())
                                .map(Store::getStoreName)
                                .orElse("PINAK Outlet");
                    }
                    return new CustomerTransactionSummary(
                            t.getId(),
                            t.getTransactionReference(),
                            storeName,
                            t.getAmount(),
                            t.getDiscountAmount(),
                            t.getPayableAmount(),
                            t.getPointsAwarded() != null ? t.getPointsAwarded() : 0,
                            t.getPaymentMethod() != null ? t.getPaymentMethod() : "UPI",
                            t.getStatus() != null ? t.getStatus().name() : "SUCCESS",
                            t.getCreatedAt()
                    );
                })
                .collect(Collectors.toList());

        // Recent Bookings (Live from table_bookings table)
        List<CustomerBookingSummary> recentBookings = tableBookingRepository.findAll().stream()
                .filter(b -> user.getId().equals(b.getUserId()) || (user.getPhone() != null && user.getPhone().equals(b.getCustomerPhone())))
                .sorted(Comparator.comparing((TableBooking b) -> b.getCreatedAt() != null ? b.getCreatedAt() : Instant.EPOCH).reversed())
                .limit(10)
                .map(b -> {
                    String storeName = "PINAK Dining Partner";
                    if (b.getStoreId() != null) {
                        storeName = storeRepository.findById(b.getStoreId())
                                .map(Store::getStoreName)
                                .orElse("PINAK Dining Outlet");
                    }
                    return new CustomerBookingSummary(
                            b.getId(),
                            b.getBookingRef(),
                            storeName,
                            b.getBookingDate(),
                            b.getSlotTime(),
                            b.getGuests() != null ? b.getGuests() : 2,
                            b.getTotalPaid() != null ? b.getTotalPaid() : BigDecimal.ZERO,
                            b.getBillAmount() != null ? b.getBillAmount() : BigDecimal.ZERO,
                            b.getCoinsEarned() != null ? b.getCoinsEarned() : 0,
                            b.getVerificationCode(),
                            b.getStatus(),
                            b.getCreatedAt()
                    );
                })
                .collect(Collectors.toList());

        // Recent Redemptions
        List<CustomerRedemptionSummary> recentRedemptions = Collections.emptyList();

        return new CustomerDetailResponse(
                profile,
                rewardWallet,
                recentTransactions,
                recentBookings,
                recentRedemptions
        );
    }

    @Override
    @Transactional
    public CustomerDirectoryResponse updateCustomerStatus(
            UUID customerId,
            String status,
            String reason,
            UUID adminUserId,
            String requestId) {

        User user = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));

        UserStatus targetStatus = UserStatus.valueOf(status.trim().toUpperCase());
        UserStatus oldStatus = user.getStatus();
        user.setStatus(targetStatus);
        user.setUpdatedAt(Instant.now());
        User saved = userRepository.saveAndFlush(user);

        log.info("Super Admin {} updated customer {} status from {} to {} (Reason: {})",
                adminUserId, customerId, oldStatus, targetStatus, reason);

        if (auditService != null) {
            auditService.record(
                    targetStatus == UserStatus.ACTIVE ? AuditEventType.ACCOUNT_ACTIVATED : AuditEventType.ACCOUNT_SUSPENDED,
                    customerId,
                    null,
                    "Admin Portal",
                    requestId,
                    String.format("{\"adminUserId\":\"%s\",\"oldStatus\":\"%s\",\"newStatus\":\"%s\",\"reason\":\"%s\"}", adminUserId, oldStatus, targetStatus, reason != null ? reason : "Admin update")
            );
        }

        return mapToCustomerDirectoryResponse(saved);
    }

    @Override
    @Transactional
    public CustomerRewardSummary adjustCustomerRewardPoints(
            UUID customerId,
            int pointsDelta,
            String reason,
            UUID adminUserId) {

        User user = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));

        BigDecimal rupeeAmount = BigDecimal.valueOf(Math.abs(pointsDelta)).multiply(BigDecimal.valueOf(0.10)).setScale(2, RoundingMode.HALF_UP);
        RewardLedgerType type = pointsDelta >= 0 ? RewardLedgerType.CREDIT : RewardLedgerType.DEBIT;

        AdminRewardAdjustmentRequest adjReq = new AdminRewardAdjustmentRequest(
                customerId,
                rupeeAmount,
                type,
                reason != null && !reason.isBlank() ? reason : "Super Admin manual points adjustment"
        );

        String idempotencyKey = "adj_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 6);
        AdminRewardAdjustmentResponse adjRes = rewardService.adjustReward(adjReq, idempotencyKey, UUID.randomUUID().toString(), adminUserId);

        RewardBalanceResponse bal = rewardService.getRewardBalance(customerId);
        int pts = bal.availableCoins() != null ? bal.availableCoins().intValue() : 0;
        int earned = bal.lifetimeEarned() != null ? bal.lifetimeEarned().multiply(BigDecimal.valueOf(10)).intValue() : pts;
        int redeemed = bal.lifetimeRedeemed() != null ? bal.lifetimeRedeemed().multiply(BigDecimal.valueOf(10)).intValue() : 0;

        return new CustomerRewardSummary(
                customerId,
                pts,
                earned,
                redeemed,
                pts >= 600 ? "VIP" : (pts >= 400 ? "GOLD" : (pts >= 150 ? "SILVER" : "BRONZE")),
                BigDecimal.valueOf(pts).multiply(BigDecimal.valueOf(0.10)).setScale(2, RoundingMode.HALF_UP),
                pts >= 600 ? 2.0 : (pts >= 400 ? 1.5 : (pts >= 150 ? 1.2 : 1.0)),
                user.getStatus().name()
        );
    }

    @Override
    @Transactional
    public CustomerDirectoryResponse createCustomer(CreateCustomerRequest request, UUID adminUserId) {
        String phone = request.phone().trim();
        if (userRepository.existsByPhone(phone)) {
            throw DuplicateResourceException.mobile(phone);
        }

        String email = request.email() != null && !request.email().isBlank()
                ? request.email().trim().toLowerCase()
                : "user." + phone.replaceAll("[^0-9]", "") + "@pinak.app";

        if (userRepository.existsByEmail(email)) {
            throw DuplicateResourceException.email(email);
        }

        String fullName = request.name().trim();
        String[] parts = fullName.split("\\s+", 2);
        String firstName = parts[0];
        String lastName = parts.length > 1 ? parts[1] : "";

        User customer = new User(
                email,
                fullName,
                firstName,
                lastName,
                passwordEncoder.encode("Admin@123456"),
                Role.CUSTOMER
        );
        customer.setPhone(phone);
        customer.setMobileVerified(true);
        customer.setEmailVerified(true);
        customer.setProfileCompleted(true);
        customer.setPrimaryCity(request.city() != null && !request.city().isBlank() ? request.city().trim() : "Nagpur");
        customer.setState(request.state() != null && !request.state().isBlank() ? request.state().trim() : "Maharashtra");
        customer.setDistrict(request.district() != null ? request.district().trim() : customer.getPrimaryCity());
        customer.setPincode(request.pincode() != null ? request.pincode().trim() : "440010");
        customer.setAddress(request.address() != null ? request.address().trim() : "");
        customer.setGender(request.gender() != null ? request.gender().trim() : "OTHER");
        customer.setReferralCode(request.referralCode() != null && !request.referralCode().isBlank() ? request.referralCode().trim().toUpperCase() : ("PINAK" + UUID.randomUUID().toString().substring(0, 4).toUpperCase()));
        customer.setStatus(UserStatus.ACTIVE);

        if (request.birthday() != null && !request.birthday().isBlank()) {
            try {
                customer.setBirthday(LocalDate.parse(request.birthday().trim()));
            } catch (Exception ignored) {}
        }

        User saved = userRepository.saveAndFlush(customer);

        // Initialize Reward Account
        int bonusCoins = request.initialBonusCoins() != null ? request.initialBonusCoins() : 100;
        RewardAccount rewardAcc = new RewardAccount(saved.getId());
        rewardAcc.setAvailableBalance(BigDecimal.valueOf(bonusCoins).multiply(BigDecimal.valueOf(0.10)));
        rewardAcc.setLifetimeEarned(BigDecimal.valueOf(bonusCoins).multiply(BigDecimal.valueOf(0.10)));
        rewardAcc.setCurrency("INR");
        rewardAccountRepository.saveAndFlush(rewardAcc);

        if (auditService != null) {
            auditService.record(
                    AuditEventType.REGISTER_SUCCESS,
                    saved.getId(),
                    null,
                    "Admin Portal",
                    UUID.randomUUID().toString(),
                    String.format("{\"adminUserId\":\"%s\",\"customerId\":\"%s\",\"name\":\"%s\",\"phone\":\"%s\",\"city\":\"%s\"}", adminUserId, saved.getId(), fullName, phone, customer.getPrimaryCity())
            );
        }

        return mapToCustomerDirectoryResponse(saved);
    }

    private CustomerDirectoryResponse mapToCustomerDirectoryResponse(User u) {
        UUID uid = u.getId();
        String name = u.getName() != null && !u.getName().isBlank()
                ? u.getName()
                : ((u.getFirstName() != null ? u.getFirstName() : "") + (u.getLastName() != null ? " " + u.getLastName() : "")).trim();
        if (name.isBlank()) name = "Customer #" + uid.toString().substring(0, 6);

        String initials = Arrays.stream(name.split("\\s+"))
                .filter(p -> !p.isBlank())
                .map(p -> p.substring(0, 1))
                .collect(Collectors.joining(""))
                .toUpperCase();
        if (initials.length() > 2) initials = initials.substring(0, 2);
        if (initials.isEmpty()) initials = "CU";

        String city = u.getPrimaryCity() != null && !u.getPrimaryCity().isBlank() ? u.getPrimaryCity() : "Nagpur";

        // Aggregate visits: Transactions + Table Bookings
        long txnVisits = transactionRepository.findAll().stream()
                .filter(t -> (uid.equals(t.getCustomerId()) || uid.equals(t.getUserId())) && t.getStatus() == TransactionStatus.SUCCESS)
                .count();

        long bookingVisits = tableBookingRepository.findAll().stream()
                .filter(b -> (uid.equals(b.getUserId()) || (u.getPhone() != null && u.getPhone().equals(b.getCustomerPhone()))) && "COMPLETED".equalsIgnoreCase(b.getStatus()))
                .count();

        long visits = txnVisits + bookingVisits;

        // Aggregate total spend
        BigDecimal txnSpend = transactionRepository.findAll().stream()
                .filter(t -> (uid.equals(t.getCustomerId()) || uid.equals(t.getUserId())) && t.getStatus() == TransactionStatus.SUCCESS)
                .map(t -> t.getPayableAmount() != null ? t.getPayableAmount() : (t.getAmount() != null ? t.getAmount() : BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal bookingSpend = tableBookingRepository.findAll().stream()
                .filter(b -> (uid.equals(b.getUserId()) || (u.getPhone() != null && u.getPhone().equals(b.getCustomerPhone()))) && "COMPLETED".equalsIgnoreCase(b.getStatus()))
                .map(b -> b.getTotalPaid() != null ? b.getTotalPaid() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalSpend = txnSpend.add(bookingSpend).setScale(2, RoundingMode.HALF_UP);

        // Fetch points from reward account
        int coins = 0;
        try {
            Optional<RewardAccount> accOpt = rewardAccountRepository.findByCustomerId(uid);
            if (accOpt.isPresent()) {
                coins = accOpt.get().getAvailableBalance().multiply(BigDecimal.valueOf(10)).intValue();
            } else {
                RewardBalanceResponse bal = rewardService.getRewardBalance(uid);
                if (bal.availableCoins() != null) {
                    coins = bal.availableCoins().intValue();
                }
            }
        } catch (Exception ignored) {}

        // Tier
        String tier = coins >= 600 || totalSpend.compareTo(BigDecimal.valueOf(5000)) >= 0
                ? "VIP"
                : (coins >= 400 || totalSpend.compareTo(BigDecimal.valueOf(3000)) >= 0
                ? "GOLD"
                : (coins >= 150 || totalSpend.compareTo(BigDecimal.valueOf(1000)) >= 0 ? "SILVER" : "BRONZE"));

        // Segment
        String segment = (visits >= 5 || totalSpend.compareTo(BigDecimal.valueOf(2000)) >= 0)
                ? "Power user"
                : (visits >= 1 || totalSpend.compareTo(BigDecimal.ZERO) > 0 ? "Regular" : "New");

        // Latest activity
        Instant lastActive = u.getUpdatedAt() != null ? u.getUpdatedAt() : (u.getCreatedAt() != null ? u.getCreatedAt() : Instant.now());

        return new CustomerDirectoryResponse(
                u.getId(),
                name,
                u.getFirstName(),
                u.getLastName(),
                u.getPhone(),
                u.getEmail(),
                city,
                u.getPrimaryCity(),
                u.getState(),
                u.getDistrict(),
                u.getPincode(),
                u.getAddress(),
                u.getGender(),
                u.getBirthday(),
                u.getReferralCode(),
                u.getReferredByCode(),
                u.isProfileCompleted(),
                u.getStatus() != null ? u.getStatus().name() : "ACTIVE",
                visits,
                totalSpend,
                coins,
                tier,
                segment,
                u.getCreatedAt(),
                lastActive,
                initials
        );
    }
}
