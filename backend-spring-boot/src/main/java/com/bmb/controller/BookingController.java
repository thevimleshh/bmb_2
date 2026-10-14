package com.bmb.controller;

import com.bmb.dto.BookingDtos.*;
import com.bmb.entity.Booking;
import com.bmb.entity.Cancellation;
import com.bmb.repository.BookingRepository;
import com.bmb.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final BookingRepository bookingRepository;

    public BookingController(BookingService bookingService, BookingRepository bookingRepository) {
        this.bookingService = bookingService;
        this.bookingRepository = bookingRepository;
    }

    @PostMapping("/confirm")
    public ResponseEntity<?> confirmBooking(@RequestBody CreateBookingRequest request) {
        try {
            // Default user ID for checkout or extracted from token
            Long userId = 2L;
            Booking booking = bookingService.confirmBooking(request, userId);
            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<List<Booking>> getMyBookings() {
        Long userId = 2L;
        return ResponseEntity.ok(bookingRepository.findByUserIdOrderByBookingDateDesc(userId));
    }

    @GetMapping("/pnr/{pnr}")
    public ResponseEntity<?> getBookingByPnr(@PathVariable String pnr) {
        return bookingRepository.findByPnr(pnr)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{bookingId}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable Long bookingId, @RequestBody CancellationRequest request) {
        try {
            Long userId = 2L;
            Cancellation cancellation = bookingService.cancelBooking(bookingId, request.getReason(), userId);
            return ResponseEntity.ok(cancellation);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
