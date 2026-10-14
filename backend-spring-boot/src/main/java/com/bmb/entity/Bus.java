package com.bmb.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "buses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bus_number", nullable = false, unique = true)
    private String busNumber;

    @Column(name = "operator_name", nullable = false)
    private String operatorName;

    @Column(name = "bus_type", nullable = false)
    private String busType;

    @Column(name = "total_seats", nullable = false)
    private Integer totalSeats = 36;

    @Column(name = "has_wifi")
    private Boolean hasWifi = true;

    @Column(name = "has_charging")
    private Boolean hasCharging = true;

    @Column(name = "has_blanket")
    private Boolean hasBlanket = true;

    @Column(name = "has_water_bottle")
    private Boolean hasWaterBottle = true;

    @Column(name = "has_emergency_exit")
    private Boolean hasEmergencyExit = true;

    private Double rating = 4.5;

    @Column(name = "is_active")
    private Boolean isActive = true;
}
