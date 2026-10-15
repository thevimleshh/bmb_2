package com.bmb.controller;

import com.bmb.dto.BookingDtos.SeatLockRequest;
import com.bmb.dto.BookingDtos.SeatLockResponse;
import com.bmb.entity.Schedule;
import com.bmb.entity.SeatInventory;
import com.bmb.repository.ScheduleRepository;
import com.bmb.repository.SeatInventoryRepository;
import com.bmb.service.BookingService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/buses")
public class BusController {

    private final ScheduleRepository scheduleRepository;
    private final SeatInventoryRepository seatRepository;
    private final com.bmb.repository.BoardingDroppingPointRepository pointRepository;
    private final BookingService bookingService;

    public BusController(ScheduleRepository scheduleRepository,
                         SeatInventoryRepository seatRepository,
                         com.bmb.repository.BoardingDroppingPointRepository pointRepository,
                         BookingService bookingService) {
        this.scheduleRepository = scheduleRepository;
        this.seatRepository = seatRepository;
        this.pointRepository = pointRepository;
        this.bookingService = bookingService;
    }

    @GetMapping("/cities")
    public List<String> getAvailableCities() {
        return Arrays.asList("Mumbai", "Pune", "Bangalore", "Chennai", "Delhi", "Jaipur", "Hyderabad", "Goa", "Ahmedabad");
    }

    @GetMapping("/search")
    public List<Schedule> searchBuses(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate searchDate = date != null ? date : LocalDate.now();
        return scheduleRepository.searchSchedules(from, to, searchDate);
    }

    @GetMapping("/{scheduleId}/points")
    public Map<String, Object> getPoints(@PathVariable Long scheduleId) {
        var points = pointRepository.findByScheduleIdOrderByScheduledTimeAsc(scheduleId);
        var boarding = points.stream().filter(p -> p.getPointType() == com.bmb.entity.BoardingDroppingPoint.PointType.BOARDING).toList();
        var dropping = points.stream().filter(p -> p.getPointType() == com.bmb.entity.BoardingDroppingPoint.PointType.DROPPING).toList();
        return Map.of(
            "scheduleId", scheduleId,
            "boardingPoints", boarding,
            "droppingPoints", dropping
        );
    }

    @GetMapping("/{scheduleId}/seats")
    public Map<String, Object> getSeats(@PathVariable Long scheduleId) {
        var seats = seatRepository.findByScheduleIdOrderBySeatNumberAsc(scheduleId);
        var schedule = scheduleRepository.findById(scheduleId).orElse(null);
        var points = pointRepository.findByScheduleIdOrderByScheduledTimeAsc(scheduleId);
        var boarding = points.stream().filter(p -> p.getPointType() == com.bmb.entity.BoardingDroppingPoint.PointType.BOARDING).toList();
        var dropping = points.stream().filter(p -> p.getPointType() == com.bmb.entity.BoardingDroppingPoint.PointType.DROPPING).toList();
        return Map.of(
            "scheduleId", scheduleId,
            "schedule", schedule != null ? schedule : Map.of(),
            "seats", seats,
            "boardingPoints", boarding,
            "droppingPoints", dropping
        );
    }

    @PostMapping("/{scheduleId}/lock-seats")
    public ResponseEntity<?> lockSeats(@PathVariable Long scheduleId, @RequestBody SeatLockRequest request) {
        SeatLockResponse response = bookingService.lockSeats(scheduleId, request.getSeatNumbers(), null);
        if (!response.isSuccess()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }
}
