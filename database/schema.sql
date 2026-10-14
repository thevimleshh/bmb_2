-- ====================================================================
-- BMB (Book My Bus) - Relational MySQL Database Schema & Initial Seeds
-- Database: bmb_bus_booking
-- Compatible with MySQL 8.0+ / MariaDB 10.5+
-- ====================================================================

CREATE DATABASE IF NOT EXISTS bmb_bus_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bmb_bus_booking;

-- Disable foreign key checks for clean teardown/rebuild
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS cancellations;
DROP TABLE IF EXISTS passengers;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS seat_inventory;
DROP TABLE IF EXISTS boarding_dropping_points;
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS routes;
DROP TABLE IF EXISTS buses;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users Table (Passengers & Administrators)
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role ENUM('ROLE_USER', 'ROLE_ADMIN') DEFAULT 'ROLE_USER' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Buses Table (Fleet specification)
CREATE TABLE buses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bus_number VARCHAR(50) NOT NULL UNIQUE,
    operator_name VARCHAR(150) NOT NULL,
    bus_type ENUM('AC_SLEEPER_2_1', 'AC_SEATER_2_2', 'NON_AC_SLEEPER', 'NON_AC_SEATER', 'VOLVO_MULTI_AXLE') NOT NULL,
    total_seats INT NOT NULL DEFAULT 36,
    has_wifi BOOLEAN DEFAULT TRUE,
    has_charging BOOLEAN DEFAULT TRUE,
    has_blanket BOOLEAN DEFAULT TRUE,
    has_water_bottle BOOLEAN DEFAULT TRUE,
    has_emergency_exit BOOLEAN DEFAULT TRUE,
    rating DECIMAL(2,1) DEFAULT 4.5,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Routes Table (Intercity corridors)
CREATE TABLE routes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    from_city VARCHAR(100) NOT NULL,
    to_city VARCHAR(100) NOT NULL,
    distance_km INT NOT NULL,
    estimated_duration_hours DECIMAL(4,2) NOT NULL,
    INDEX idx_route_from_to (from_city, to_city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Schedules Table (Daily departures)
CREATE TABLE schedules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bus_id BIGINT NOT NULL,
    route_id BIGINT NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    journey_date DATE NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    INDEX idx_schedule_date (journey_date),
    INDEX idx_schedule_bus (bus_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Boarding & Dropping Points Table
CREATE TABLE boarding_dropping_points (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    schedule_id BIGINT NOT NULL,
    point_type ENUM('BOARDING', 'DROPPING') NOT NULL,
    location_name VARCHAR(200) NOT NULL,
    landmark VARCHAR(200) NOT NULL,
    address VARCHAR(255) NULL,
    scheduled_time TIME NOT NULL,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Seat Inventory Table (Seat Layout and Concurrency Lock States)
CREATE TABLE seat_inventory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    schedule_id BIGINT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    deck ENUM('LOWER', 'UPPER') DEFAULT 'LOWER' NOT NULL,
    seat_type ENUM('SEATER', 'SLEEPER') DEFAULT 'SEATER' NOT NULL,
    is_window BOOLEAN DEFAULT FALSE,
    price DECIMAL(10,2) NOT NULL,
    status ENUM('AVAILABLE', 'LOCKED', 'BOOKED') DEFAULT 'AVAILABLE' NOT NULL,
    locked_by_user_id BIGINT NULL,
    lock_expires_at TIMESTAMP NULL,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (locked_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uk_schedule_seat (schedule_id, seat_number),
    INDEX idx_seat_status (schedule_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Bookings Table (Confirmed Reservations)
CREATE TABLE bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pnr VARCHAR(20) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    schedule_id BIGINT NOT NULL,
    boarding_point VARCHAR(200) NOT NULL,
    dropping_point VARCHAR(200) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    final_amount DECIMAL(10,2) NOT NULL,
    coupon_code VARCHAR(30) NULL,
    payment_id VARCHAR(100) NULL,
    payment_status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') DEFAULT 'PAID' NOT NULL,
    booking_status ENUM('CONFIRMED', 'CANCELLED') DEFAULT 'CONFIRMED' NOT NULL,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE RESTRICT,
    INDEX idx_pnr (pnr),
    INDEX idx_user_bookings (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Passengers Table (Passenger Manifest per Booking)
CREATE TABLE passengers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    name VARCHAR(120) NOT NULL,
    age INT NOT NULL,
    gender ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Cancellations Table (Refund & Seat Release Auditing)
CREATE TABLE cancellations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    refund_percentage INT NOT NULL,
    refund_amount DECIMAL(10,2) NOT NULL,
    refund_status ENUM('PROCESSED', 'FAILED') DEFAULT 'PROCESSED' NOT NULL,
    cancelled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ====================================================================
-- SEED DATA: Realistic Intercity Buses, Schedules & Users
-- ====================================================================

-- Default Passwords: "Password123!" (BCrypt hashed with cost factor 10)
-- $2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lR0J5c3zV1lKx0G1vR3o3W0pZ0y12
INSERT INTO users (id, name, email, password_hash, phone, role) VALUES
(1, 'Admin Manager', 'admin@bmb.com', '$2a$10$7R3v89rE2u8f7w0oQ9KkJe8W2kP3zX5qZ0y1vR3o3W0pZ0y12.admin', '9876543210', 'ROLE_ADMIN'),
(2, 'Rahul Sharma', 'rahul@example.com', '$2a$10$7R3v89rE2u8f7w0oQ9KkJe8W2kP3zX5qZ0y1vR3o3W0pZ0y12.demo', '9898989898', 'ROLE_USER');

-- Fleet of Premium Bus Operators
INSERT INTO buses (id, bus_number, operator_name, bus_type, total_seats, has_wifi, has_charging, has_blanket, has_water_bottle, rating) VALUES
(1, 'MH-12-RN-8899', 'VRL Travels', 'AC_SLEEPER_2_1', 30, TRUE, TRUE, TRUE, TRUE, 4.8),
(2, 'KA-01-AB-1244', 'IntrCity SmartBus', 'VOLVO_MULTI_AXLE', 36, TRUE, TRUE, TRUE, TRUE, 4.9),
(3, 'DL-01-ZG-9001', 'Zingbus Express', 'AC_SLEEPER_2_1', 30, TRUE, TRUE, TRUE, TRUE, 4.7),
(4, 'TS-09-OR-4411', 'Orange Tours and Travels', 'AC_SLEEPER_2_1', 30, TRUE, TRUE, TRUE, TRUE, 4.6),
(5, 'TN-07-SR-7733', 'SRS Travels', 'AC_SEATER_2_2', 40, FALSE, TRUE, FALSE, TRUE, 4.3);

-- Key Routes
INSERT INTO routes (id, from_city, to_city, distance_km, estimated_duration_hours) VALUES
(1, 'Mumbai', 'Pune', 150, 3.5),
(2, 'Pune', 'Mumbai', 150, 3.5),
(3, 'Bangalore', 'Chennai', 350, 6.0),
(4, 'Chennai', 'Bangalore', 350, 6.0),
(5, 'Delhi', 'Jaipur', 280, 5.0),
(6, 'Jaipur', 'Delhi', 280, 5.0),
(7, 'Hyderabad', 'Bangalore', 570, 8.5),
(8, 'Bangalore', 'Hyderabad', 570, 8.5);

-- Daily Schedules (Current and upcoming dates)
INSERT INTO schedules (id, bus_id, route_id, departure_time, arrival_time, journey_date, base_price) VALUES
(1, 1, 1, '06:30:00', '10:00:00', CURDATE(), 550.00),
(2, 2, 1, '14:00:00', '17:30:00', CURDATE(), 650.00),
(3, 3, 1, '22:30:00', '02:00:00', CURDATE(), 750.00),
(4, 2, 3, '07:00:00', '13:00:00', CURDATE(), 899.00),
(5, 4, 3, '21:00:00', '03:00:00', CURDATE(), 1150.00),
(6, 3, 5, '06:00:00', '11:00:00', CURDATE(), 699.00),
(7, 1, 5, '23:00:00', '04:00:00', CURDATE(), 950.00),
(8, 4, 7, '20:30:00', '05:00:00', CURDATE(), 1299.00);

-- Boarding & Dropping Points for Schedule 1 (Mumbai to Pune - Morning)
INSERT INTO boarding_dropping_points (schedule_id, point_type, location_name, landmark, address, scheduled_time) VALUES
(1, 'BOARDING', 'Borivali West', 'Near Gokul Hotel', 'Western Express Highway, Borivali West, Mumbai', '06:30:00'),
(1, 'BOARDING', 'Andheri East', 'Bisleri Flyover Bridge', 'WEH Metro Station Junction, Andheri East, Mumbai', '07:00:00'),
(1, 'BOARDING', 'Dadar East', 'Near Swami Narayan Temple', 'Asiad Bus Terminal, Dadar TT Circle, Mumbai', '07:20:00'),
(1, 'BOARDING', 'Vashi Toll Plaza', 'Below Highway Bridge', 'Sector 17, Vashi, Navi Mumbai', '07:45:00'),
(1, 'DROPPING', 'Hinjewadi Bridge', 'Phase 1 Entry Gate', 'Wakad-Hinjewadi Flyover, Pune', '09:00:00'),
(1, 'DROPPING', 'Wakad Flyover', 'Near Ginger Hotel', 'Mumbai-Bangalore Highway, Wakad, Pune', '09:15:00'),
(1, 'DROPPING', 'Swargate BMB Terminal', 'Platform 3', 'Jedhe Chowk, Swargate, Pune', '10:00:00');

-- Boarding & Dropping Points for Schedule 2 (Mumbai to Pune - Afternoon)
INSERT INTO boarding_dropping_points (schedule_id, point_type, location_name, landmark, address, scheduled_time) VALUES
(2, 'BOARDING', 'Borivali West', 'Near Gokul Hotel', 'Western Express Highway, Borivali West, Mumbai', '13:30:00'),
(2, 'BOARDING', 'Dadar East', 'Near Swami Narayan Temple', 'Asiad Bus Terminal, Dadar TT Circle, Mumbai', '14:00:00'),
(2, 'BOARDING', 'Chembur', 'Yogi Hotel Junction', 'Sion-Panvel Highway, Chembur East, Mumbai', '14:30:00'),
(2, 'DROPPING', 'Hinjewadi Bridge', 'Phase 1 Entry Gate', 'Wakad-Hinjewadi Flyover, Pune', '16:45:00'),
(2, 'DROPPING', 'Swargate BMB Terminal', 'Platform 3', 'Jedhe Chowk, Swargate, Pune', '17:30:00');

-- Boarding & Dropping Points for Schedule 3 (Mumbai to Pune - Night)
INSERT INTO boarding_dropping_points (schedule_id, point_type, location_name, landmark, address, scheduled_time) VALUES
(3, 'BOARDING', 'Borivali West', 'Near Gokul Hotel', 'Western Express Highway, Borivali West, Mumbai', '22:00:00'),
(3, 'BOARDING', 'Andheri East', 'Bisleri Flyover Bridge', 'WEH Metro Station Junction, Andheri East, Mumbai', '22:30:00'),
(3, 'BOARDING', 'Vashi Toll Plaza', 'Below Highway Bridge', 'Sector 17, Vashi, Navi Mumbai', '23:15:00'),
(3, 'DROPPING', 'Wakad Flyover', 'Near Ginger Hotel', 'Mumbai-Bangalore Highway, Wakad, Pune', '01:15:00'),
(3, 'DROPPING', 'Swargate BMB Terminal', 'Platform 3', 'Jedhe Chowk, Swargate, Pune', '02:00:00');

-- Boarding & Dropping Points for Schedule 4 (Bangalore to Chennai - Morning)
INSERT INTO boarding_dropping_points (schedule_id, point_type, location_name, landmark, address, scheduled_time) VALUES
(4, 'BOARDING', 'Majestic Metro Station', 'Terminal Exit Gate 2', 'Subhash Nagar, Central Bus Stand, Bangalore', '07:00:00'),
(4, 'BOARDING', 'Indiranagar', '100ft Road KFC Junction', 'Near Indiranagar Metro, Bangalore', '07:30:00'),
(4, 'BOARDING', 'Electronic City Toll', 'Near Elevated Highway', 'Hosur Main Road, Electronic City Phase 1, Bangalore', '08:15:00'),
(4, 'DROPPING', 'Poonamallee Bypass', 'Opposite Saveetha Hospital', 'Chennai Outer Ring Road, Poonamallee', '12:15:00'),
(4, 'DROPPING', 'Koyambedu CMBT', 'Near Omni Bus Stand', 'Jawaharlal Nehru Road, Koyambedu, Chennai', '13:00:00');

-- Boarding & Dropping Points for Schedule 5 (Bangalore to Chennai - Night)
INSERT INTO boarding_dropping_points (schedule_id, point_type, location_name, landmark, address, scheduled_time) VALUES
(5, 'BOARDING', 'Majestic Metro Station', 'Terminal Exit Gate 2', 'Subhash Nagar, Central Bus Stand, Bangalore', '21:00:00'),
(5, 'BOARDING', 'Koramangala', 'Water Tank Junction', '80 Feet Road, 4th Block, Koramangala, Bangalore', '21:30:00'),
(5, 'BOARDING', 'Electronic City Toll', 'Elevated Highway Ramp', 'Hosur Main Road, Electronic City Phase 1, Bangalore', '22:15:00'),
(5, 'DROPPING', 'Poonamallee Bypass', 'Opposite Saveetha Hospital', 'Chennai Outer Ring Road, Poonamallee', '02:15:00'),
(5, 'DROPPING', 'Koyambedu CMBT', 'Near Omni Bus Stand', 'Jawaharlal Nehru Road, Koyambedu, Chennai', '03:00:00');

-- Boarding & Dropping Points for Schedule 6 (Delhi to Jaipur - Morning)
INSERT INTO boarding_dropping_points (schedule_id, point_type, location_name, landmark, address, scheduled_time) VALUES
(6, 'BOARDING', 'Kashmiri Gate ISBT', 'Metro Station Gate 1', 'Lothian Road, ISBT Kashmiri Gate, Delhi', '06:00:00'),
(6, 'BOARDING', 'Dhaula Kuan', 'Metro Station Bus Bay', 'Ring Road, Dhaula Kuan, New Delhi', '06:30:00'),
(6, 'BOARDING', 'IFFCO Chowk Gurgaon', 'Near Metro Station Exit', 'Delhi-Jaipur Expressway, Sector 29, Gurgaon', '07:15:00'),
(6, 'DROPPING', 'Transport Nagar', 'Delhi Highway Entry Toll', 'Ghat Ki Guni, Transport Nagar, Jaipur', '10:15:00'),
(6, 'DROPPING', 'Sindhi Camp Bus Stand', 'Platform 4, Main Bay', 'Station Road, Sindhi Camp, Jaipur', '11:00:00');

-- Boarding & Dropping Points for Schedule 7 (Delhi to Jaipur - Night)
INSERT INTO boarding_dropping_points (schedule_id, point_type, location_name, landmark, address, scheduled_time) VALUES
(7, 'BOARDING', 'Kashmiri Gate ISBT', 'Metro Station Gate 1', 'Lothian Road, ISBT Kashmiri Gate, Delhi', '23:00:00'),
(7, 'BOARDING', 'IFFCO Chowk Gurgaon', 'Near Metro Station Exit', 'Delhi-Jaipur Expressway, Sector 29, Gurgaon', '23:55:00'),
(7, 'DROPPING', 'Transport Nagar', 'Delhi Highway Entry Toll', 'Ghat Ki Guni, Transport Nagar, Jaipur', '03:15:00'),
(7, 'DROPPING', 'Sindhi Camp Bus Stand', 'Platform 4, Main Bay', 'Station Road, Sindhi Camp, Jaipur', '04:00:00');

-- Boarding & Dropping Points for Schedule 8 (Hyderabad to Bangalore - Night)
INSERT INTO boarding_dropping_points (schedule_id, point_type, location_name, landmark, address, scheduled_time) VALUES
(8, 'BOARDING', 'Miyapur', 'Allwyn X Roads Metro', 'National Highway 65, Miyapur, Hyderabad', '20:30:00'),
(8, 'BOARDING', 'Ameerpet', 'Metro Station Pillar 1042', 'MCH Complex, Ameerpet, Hyderabad', '21:00:00'),
(8, 'BOARDING', 'Shamshabad', 'Airport Approach Junction', 'Bangalore Highway, Shamshabad, Hyderabad', '22:00:00'),
(8, 'DROPPING', 'Hebbal Flyover', 'Near Esteem Mall', 'Bellary Road, Hebbal, Bangalore', '04:00:00'),
(8, 'DROPPING', 'Majestic Metro Station', 'Terminal Exit Gate 2', 'Subhash Nagar, Central Bus Stand, Bangalore', '05:00:00');

-- Pre-seed Seat Inventory for Schedule 1 (Lower and Upper Deck)
INSERT INTO seat_inventory (schedule_id, seat_number, deck, seat_type, is_window, price, status) VALUES
(1, 'L1', 'LOWER', 'SLEEPER', TRUE, 550.00, 'AVAILABLE'),
(1, 'L2', 'LOWER', 'SLEEPER', FALSE, 550.00, 'AVAILABLE'),
(1, 'L3', 'LOWER', 'SLEEPER', TRUE, 550.00, 'BOOKED'),
(1, 'L4', 'LOWER', 'SLEEPER', TRUE, 550.00, 'AVAILABLE'),
(1, 'L5', 'LOWER', 'SLEEPER', FALSE, 550.00, 'AVAILABLE'),
(1, 'L6', 'LOWER', 'SLEEPER', TRUE, 550.00, 'AVAILABLE'),
(1, 'L7', 'LOWER', 'SLEEPER', TRUE, 550.00, 'BOOKED'),
(1, 'L8', 'LOWER', 'SLEEPER', FALSE, 550.00, 'AVAILABLE'),
(1, 'L9', 'LOWER', 'SLEEPER', TRUE, 550.00, 'AVAILABLE'),
(1, 'L10', 'LOWER', 'SLEEPER', TRUE, 550.00, 'AVAILABLE'),
(1, 'U1', 'UPPER', 'SLEEPER', TRUE, 650.00, 'AVAILABLE'),
(1, 'U2', 'UPPER', 'SLEEPER', FALSE, 650.00, 'AVAILABLE'),
(1, 'U3', 'UPPER', 'SLEEPER', TRUE, 650.00, 'AVAILABLE'),
(1, 'U4', 'UPPER', 'SLEEPER', TRUE, 650.00, 'AVAILABLE'),
(1, 'U5', 'UPPER', 'SLEEPER', FALSE, 650.00, 'AVAILABLE'),
(1, 'U6', 'UPPER', 'SLEEPER', TRUE, 650.00, 'BOOKED'),
(1, 'U7', 'UPPER', 'SLEEPER', TRUE, 650.00, 'AVAILABLE'),
(1, 'U8', 'UPPER', 'SLEEPER', FALSE, 650.00, 'AVAILABLE'),
(1, 'U9', 'UPPER', 'SLEEPER', TRUE, 650.00, 'AVAILABLE'),
(1, 'U10', 'UPPER', 'SLEEPER', TRUE, 650.00, 'AVAILABLE');

-- Pre-seed a sample booking with PNR
INSERT INTO bookings (id, pnr, user_id, schedule_id, boarding_point, dropping_point, total_amount, discount_amount, final_amount, coupon_code, payment_id, payment_status, booking_status) VALUES
(1, 'BMB-99824', 2, 1, 'Borivali West (06:30 AM)', 'Swargate BMB Terminal (10:00 AM)', 1100.00, 100.00, 1000.00, 'BMBFIRST', 'pay_test_88291039', 'PAID', 'CONFIRMED');

INSERT INTO passengers (booking_id, seat_number, name, age, gender) VALUES
(1, 'L3', 'Rahul Sharma', 29, 'MALE'),
(1, 'L7', 'Priya Sharma', 27, 'FEMALE');
