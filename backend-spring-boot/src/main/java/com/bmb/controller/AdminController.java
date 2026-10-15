package com.bmb.controller;

import com.bmb.entity.*;
import com.bmb.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final BusRepository busRepository;
    private final ScheduleRepository scheduleRepository;
    private final RouteRepository routeRepository;
    private final BoardingDroppingPointRepository pointRepository;
    private final SeatInventoryRepository seatRepository;
    private final BookingRepository bookingRepository;

    public AdminController(BusRepository busRepository,
                           ScheduleRepository scheduleRepository,
                           RouteRepository routeRepository,
                           BoardingDroppingPointRepository pointRepository,
                           SeatInventoryRepository seatRepository,
                           BookingRepository bookingRepository) {
        this.busRepository = busRepository;
        this.scheduleRepository = scheduleRepository;
        this.routeRepository = routeRepository;
        this.pointRepository = pointRepository;
        this.seatRepository = seatRepository;
        this.bookingRepository = bookingRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        long totalBuses = busRepository.count();
        long totalRoutes = scheduleRepository.count();
        List<Booking> allBookings = bookingRepository.findAll();
        long totalBookings = allBookings.size();
        long activeBookings = allBookings.stream()
                .filter(b -> b.getBookingStatus() == Booking.BookingStatus.CONFIRMED)
                .count();

        BigDecimal totalRevenue = allBookings.stream()
                .filter(b -> b.getBookingStatus() == Booking.BookingStatus.CONFIRMED)
                .map(Booking::getFinalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalBuses", totalBuses);
        stats.put("totalRoutes", totalRoutes);
        stats.put("totalBookings", totalBookings);
        stats.put("activeBookings", activeBookings);
        stats.put("totalRevenue", totalRevenue);
        stats.put("occupancyRate", "78.4%");

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(bookingRepository.findAll());
    }

    @GetMapping("/buses")
    public ResponseEntity<?> getAllBusesAndSchedules() {
        List<Schedule> schedules = scheduleRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Schedule s : schedules) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", s.getId());
            item.put("busId", s.getBus() != null ? s.getBus().getId() : null);
            item.put("bus", s.getBus());
            item.put("fromCity", s.getRoute() != null ? s.getRoute().getFromCity() : "");
            item.put("toCity", s.getRoute() != null ? s.getRoute().getToCity() : "");
            item.put("distanceKm", s.getRoute() != null ? s.getRoute().getDistanceKm() : 0);
            item.put("durationHours", s.getRoute() != null ? s.getRoute().getEstimatedDurationHours() : 0);
            item.put("departureTime", s.getDepartureTime() != null ? s.getDepartureTime().toString() : "");
            item.put("arrivalTime", s.getArrivalTime() != null ? s.getArrivalTime().toString() : "");
            item.put("journeyDate", s.getJourneyDate() != null ? s.getJourneyDate().toString() : "");
            item.put("basePrice", s.getBasePrice());

            var seats = seatRepository.findByScheduleIdOrderBySeatNumberAsc(s.getId());
            long available = seats.stream().filter(st -> st.getStatus() == SeatInventory.SeatStatus.AVAILABLE).count();
            long booked = seats.stream().filter(st -> st.getStatus() == SeatInventory.SeatStatus.BOOKED).count();

            item.put("totalSeats", s.getBus() != null ? s.getBus().getTotalSeats() : seats.size());
            item.put("availableSeats", available);
            item.put("bookedSeats", booked);

            var points = pointRepository.findByScheduleIdOrderByScheduledTimeAsc(s.getId());
            item.put("boardingPoints", points.stream().filter(p -> p.getPointType() == BoardingDroppingPoint.PointType.BOARDING).toList());
            item.put("droppingPoints", points.stream().filter(p -> p.getPointType() == BoardingDroppingPoint.PointType.DROPPING).toList());

            result.add(item);
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/buses")
    public ResponseEntity<?> addBusAndSchedule(@RequestBody Map<String, Object> body) {
        String busNumber = (String) body.get("busNumber");
        String operatorName = (String) body.get("operatorName");
        String fromCity = (String) body.get("fromCity");
        String toCity = (String) body.get("toCity");

        if (busNumber == null || operatorName == null || fromCity == null || toCity == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "busNumber, operatorName, fromCity and toCity are required"));
        }

        // 1. Create or find Bus
        Bus bus = busRepository.findByBusNumber(busNumber.trim().toUpperCase()).orElse(null);
        if (bus == null) {
            bus = new Bus();
            bus.setBusNumber(busNumber.trim().toUpperCase());
            bus.setOperatorName(operatorName.trim());
            bus.setBusType(body.get("busType") != null ? Bus.BusType.valueOf((String) body.get("busType")) : Bus.BusType.AC_SLEEPER_2_1);
            bus.setTotalSeats(body.get("totalSeats") != null ? ((Number) body.get("totalSeats")).intValue() : 30);
            bus.setHasWifi(Boolean.TRUE.equals(body.get("hasWifi")));
            bus.setHasCharging(Boolean.TRUE.equals(body.get("hasCharging")));
            bus.setHasBlanket(Boolean.TRUE.equals(body.get("hasBlanket")));
            bus.setHasWaterBottle(Boolean.TRUE.equals(body.get("hasWaterBottle")));
            bus.setRating(BigDecimal.valueOf(4.8));
            bus = busRepository.save(bus);
        }

        // 2. Find or create Route
        Route route = routeRepository.findByFromCityIgnoreCaseAndToCityIgnoreCase(fromCity.trim(), toCity.trim()).orElse(null);
        if (route == null) {
            route = new Route();
            route.setFromCity(fromCity.trim());
            route.setToCity(toCity.trim());
            route.setDistanceKm(body.get("distanceKm") != null ? ((Number) body.get("distanceKm")).intValue() : 350);
            route.setEstimatedDurationHours(body.get("durationHours") != null ? BigDecimal.valueOf(((Number) body.get("durationHours")).doubleValue()) : BigDecimal.valueOf(6.0));
            route = routeRepository.save(route);
        }

        // 3. Create Schedule
        Schedule schedule = new Schedule();
        schedule.setBus(bus);
        schedule.setRoute(route);
        schedule.setJourneyDate(body.get("journeyDate") != null ? LocalDate.parse((String) body.get("journeyDate")) : LocalDate.now());
        schedule.setDepartureTime(LocalTime.of(8, 0));
        schedule.setArrivalTime(LocalTime.of(14, 0));
        schedule.setBasePrice(body.get("basePrice") != null ? BigDecimal.valueOf(((Number) body.get("basePrice")).doubleValue()) : BigDecimal.valueOf(750.00));
        schedule = scheduleRepository.save(schedule);

        // 4. Initialize Seat Inventory
        int totalSeats = bus.getTotalSeats() > 0 ? bus.getTotalSeats() : 30;
        int seatsPerDeck = (int) Math.ceil(totalSeats / 2.0);
        List<SeatInventory> newSeats = new ArrayList<>();

        for (int i = 1; i <= seatsPerDeck; i++) {
            SeatInventory lower = new SeatInventory();
            lower.setSchedule(schedule);
            lower.setSeatNumber("L" + i);
            lower.setDeck(SeatInventory.Deck.LOWER);
            lower.setSeatType(SeatInventory.SeatType.SLEEPER);
            lower.setIsWindow(i % 3 != 2);
            lower.setPrice(schedule.getBasePrice());
            lower.setStatus(SeatInventory.SeatStatus.AVAILABLE);
            newSeats.add(lower);

            SeatInventory upper = new SeatInventory();
            upper.setSchedule(schedule);
            upper.setSeatNumber("U" + i);
            upper.setDeck(SeatInventory.Deck.UPPER);
            upper.setSeatType(SeatInventory.SeatType.SLEEPER);
            upper.setIsWindow(i % 3 != 2);
            upper.setPrice(schedule.getBasePrice().add(BigDecimal.valueOf(100)));
            upper.setStatus(SeatInventory.SeatStatus.AVAILABLE);
            newSeats.add(upper);
        }
        seatRepository.saveAll(newSeats);

        // 5. Default Boarding and Dropping Points
        BoardingDroppingPoint bp = new BoardingDroppingPoint();
        bp.setSchedule(schedule);
        bp.setPointType(BoardingDroppingPoint.PointType.BOARDING);
        bp.setLocationName(fromCity + " Central Bus Terminal");
        bp.setLandmark("Main Departure Bay");
        bp.setAddress(fromCity + " Highway Road");
        bp.setScheduledTime(schedule.getDepartureTime());
        pointRepository.save(bp);

        BoardingDroppingPoint dp = new BoardingDroppingPoint();
        dp.setSchedule(schedule);
        dp.setPointType(BoardingDroppingPoint.PointType.DROPPING);
        dp.setLocationName(toCity + " Arrival Terminal");
        dp.setLandmark("Central Dropping Bay");
        dp.setAddress(toCity + " Central Bypass");
        dp.setScheduledTime(schedule.getArrivalTime());
        pointRepository.save(dp);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "Bus and schedule created successfully",
                "busId", bus.getId(),
                "scheduleId", schedule.getId()
        ));
    }
}
