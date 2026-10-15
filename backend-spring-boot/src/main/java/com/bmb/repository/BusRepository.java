package com.bmb.repository;

import com.bmb.entity.Bus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BusRepository extends JpaRepository<Bus, Long> {
    List<Bus> findByIsActiveTrue();
    java.util.Optional<Bus> findByBusNumber(String busNumber);
}
