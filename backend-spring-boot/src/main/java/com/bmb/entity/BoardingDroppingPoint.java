package com.bmb.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalTime;

@Entity
@Table(name = "boarding_dropping_points")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardingDroppingPoint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false)
    private Schedule schedule;

    @Enumerated(EnumType.STRING)
    @Column(name = "point_type", nullable = false)
    private PointType pointType;

    @Column(name = "location_name", nullable = false, length = 200)
    private String locationName;

    @Column(nullable = false, length = 200)
    private String landmark;

    @Column(length = 255)
    private String address;

    @Column(name = "scheduled_time", nullable = false)
    private LocalTime scheduledTime;

    public enum PointType {
        BOARDING,
        DROPPING
    }
}
