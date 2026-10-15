package com.bmb.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

public class BookingDtos {
    @Data
    public static class SeatLockRequest {
        private Long scheduleId;
        private List<String> seatNumbers;
    }

    @Data
    public static class SeatLockResponse {
        private boolean success;
        private String message;
        private List<String> lockedSeats;
        private long expiresInSeconds;
    }

    @Data
    public static class PassengerDto {
        private String name;
        private Integer age;
        private String gender;
        private String seatNumber;
    }

    @Data
    public static class CreateBookingRequest {
        private Long scheduleId;
        private String boardingPoint;
        private String droppingPoint;
        private String couponCode;
        private List<PassengerDto> passengers;
        private String razorpayPaymentId;
        private String razorpayOrderId;
        private String razorpaySignature;
    }

    @Data
    public static class CancellationRequest {
        private String reason;
    }
}
