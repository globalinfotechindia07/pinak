package com.superapp.mobile.booking.repository;

import com.superapp.mobile.booking.entity.TableBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TableBookingRepository extends JpaRepository<TableBooking, UUID> {

    Optional<TableBooking> findByBookingRef(String bookingRef);

    List<TableBooking> findByStoreIdOrderByCreatedAtDesc(UUID storeId);

    List<TableBooking> findAllByOrderByCreatedAtDesc();

    List<TableBooking> findByStoreIdInOrderByCreatedAtDesc(List<UUID> storeIds);

    List<TableBooking> findByCustomerPhoneOrderByCreatedAtDesc(String customerPhone);

    List<TableBooking> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<TableBooking> findByCustomerPhoneAndStatusOrderByCreatedAtDesc(String customerPhone, String status);

    long countByStoreIdAndBookingDateAndSlotTimeAndStatusNot(
            UUID storeId,
            LocalDate bookingDate,
            String slotTime,
            String status
    );
}
