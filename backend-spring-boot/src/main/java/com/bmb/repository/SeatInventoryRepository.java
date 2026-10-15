package com.bmb.repository;

import com.bmb.entity.SeatInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SeatInventoryRepository extends JpaRepository<SeatInventory, Long> {
    List<SeatInventory> findByScheduleIdOrderBySeatNumberAsc(Long scheduleId);

    Optional<SeatInventory> findByScheduleIdAndSeatNumber(Long scheduleId, String seatNumber);

    @Query("SELECT s FROM SeatInventory s WHERE s.schedule.id = :scheduleId AND s.seatNumber IN :seatNumbers")
    List<SeatInventory> findSeatsForLock(
        @Param("scheduleId") Long scheduleId,
        @Param("seatNumbers") List<String> seatNumbers
    );

    @Modifying
    @Query("UPDATE SeatInventory s SET s.status = 'AVAILABLE', s.lockedByUser = null, s.lockExpiresAt = null WHERE s.status = 'LOCKED' AND s.lockExpiresAt < :now")
    int releaseExpiredLocks(@Param("now") LocalDateTime now);
}
