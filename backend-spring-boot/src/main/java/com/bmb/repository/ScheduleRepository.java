package com.bmb.repository;

import com.bmb.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    @Query("SELECT s FROM Schedule s WHERE LOWER(s.route.fromCity) = LOWER(:fromCity) AND LOWER(s.route.toCity) = LOWER(:toCity) AND s.journeyDate = :journeyDate")
    List<Schedule> searchSchedules(
        @Param("fromCity") String fromCity,
        @Param("toCity") String toCity,
        @Param("journeyDate") LocalDate journeyDate
    );

    List<Schedule> findByJourneyDate(LocalDate journeyDate);
}
