package com.bmb.repository;

import com.bmb.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface RouteRepository extends JpaRepository<Route, Long> {
    Optional<Route> findByFromCityIgnoreCaseAndToCityIgnoreCase(String fromCity, String toCity);
    List<Route> findByFromCityIgnoreCase(String fromCity);
}
