package com.bmb.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cancellations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cancellation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(nullable = false)
    private String reason;

    @Column(name = "refund_percentage", nullable = false)
    private Integer refundPercentage;

    @Column(name = "refund_amount", nullable = false)
    private BigDecimal refundAmount;

    @Column(name = "refund_status", nullable = false)
    private String refundStatus = "PROCESSED";

    @Column(name = "cancelled_at", updatable = false)
    private LocalDateTime cancelledAt = LocalDateTime.now();
}
