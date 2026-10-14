package com.bmb.repository;

import com.bmb.entity.BoardingDroppingPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BoardingDroppingPointRepository extends JpaRepository<BoardingDroppingPoint, Long> {
    List<BoardingDroppingPoint> findByScheduleIdOrderByScheduledTimeAsc(Long scheduleId);
    List<BoardingDroppingPoint> findByScheduleIdAndPointTypeOrderByScheduledTimeAsc(Long scheduleId, BoardingDroppingPoint.PointType pointType);
}
