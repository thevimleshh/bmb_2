# BMB (Book My Bus) — Full-Stack Bus Booking System

A production-grade, end-to-end bus reservation platform featuring route discovery, real-time seat locking with race-condition prevention, Razorpay test checkout, printable PDF ticket generation with PNR, live bus location tracking, booking lifecycle management, and a dedicated administrator control panel.

> [!IMPORTANT]
> **Confirmed Architecture & Dual Execution Strategy:**
> - **Live Preview in AI Studio**: Full-stack Node/Express + persistent relational store running on port 3000 with complete REST endpoints, JWT authentication, seat hold transactions, Razorpay sandbox verification, and PDF generation.
> - **Local Windows Production Setup**: Standalone exportable Java Spring Boot REST API (`backend-spring-boot/`), Spring Security + JWT, JPA entities, MySQL DDL (`database/schema.sql`), `application.properties`, and Windows deployment guides.
> - **Razorpay Integration**: Razorpay checkout with test-mode signature verification and instant fallback sandbox for seamless offline verification.
> - **Live Tracking**: OpenStreetMap / Leaflet route engine with GPS coordinate streams, speed indicators, and waypoint timeline.

---

## 1. Overview & Core Concept

**BMB (Book My Bus)** is designed to simplify intercity and interstate bus travel for passengers while giving operators and system administrators granular control over schedules, seat inventories, fares, and cancellations.

- **Target Audience**: Everyday travelers booking express, sleeper, and luxury intercity buses; travel coordinators; and bus fleet operators.
- **Key Value**: Guaranteed conflict-free seat selection via temporary locks, tamper-proof e-ticket receipts with PNR and QR verification, real-time journey status, and self-service cancellations with transparent refund tracking.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Discovery & Search**:
   - Traveler searches "From" and "To" with intelligent autocomplete across 20+ major hubs (Mumbai, Pune, Bangalore, Hyderabad, Chennai, Delhi, Ahmedabad, Jaipur, etc.).
   - Selects travel date and passenger count; filters by AC / Non-AC, Sleeper / Seater, departure time slots, rating, and price range.
2. **Interactive Bus & Seat Selection**:
   - Results list displays operator name, bus type, rating, departure/arrival timestamps, duration, boarding/dropping points, and live seat count.
   - Interactive 2D bus layout (Lower Deck & Upper Deck for sleepers) showing Available, Selected, Reserved (held by another session), and Sold seats with gender-aware seat guidance.
   - 10-minute hold lock prevents duplicate bookings across concurrent users.
3. **Passenger Info & Booking Checkout**:
   - Comprehensive passenger form (Name, Age, Gender, Email, Mobile).
   - Selection of boarding point and dropping point with scheduled times and pickup landmarks.
   - Coupon discount code application (`BMBFIRST`, `JOURNEY20`, `FESTIVE100`).
4. **Payment & Verification**:
   - Razorpay Test Mode checkout modal with support for UPI, Cards, NetBanking, and Wallet simulations.
   - Backend cryptographic signature verification ensuring ticket confirmation only after confirmed payment.
5. **E-Ticket & Downloads**:
   - Instant PNR generation with formatted printable and downloadable PDF ticket including QR code, passenger list, seat numbers, fare breakdown, and operator emergency contacts.
6. **My Bookings & Cancellation**:
   - Active, upcoming, and past booking history.
   - One-click PDF re-download, live tracking launcher, and smart cancellation with refund percentage calculation based on hours before departure.
7. **Live Bus Tracking**:
   - Leaflet map rendering bus current coordinates, speed (km/h), next scheduled stop, ETA, and completed route path.
8. **Admin Operations Panel**:
   - Fleet manager view to add new buses, create schedules, configure seat matrices, update fares, and inspect live reservations.

### Visual Identity & Theme

- **Palette**:
  - Dominant Neutral: Crisp White (`#FFFFFF`) and Soft Slate (`#F8FAFC`).
  - Structural Surfaces: Deep Midnight Navy (`#0F172A` / `#1E293B`) for headers, footers, and brand badges; Warm Slate (`#E2E8F0`) for hairline borders.
  - Primary Accent: High-intent BMB Orange (`#EA580C` / `#F97316`) for primary search actions, seat selections, and confirmation CTAs.
  - Semantic Status: Forest Emerald (`#16A34A`) for confirmed/available, Amber (`#D97706`) for temporary holds, Crimson (`#DC2626`) for sold/cancelled.
- **Typography**:
  - Display: `Plus Jakarta Sans` for clean, modern headings and navigation.
  - Body: `DM Sans` for readable forms and route listings.
  - Tabular Data: Monospace `tabular-nums` for prices, PNR codes, seat numbers, and timestamps.
- **Zero-Pill Discipline**:
  - Unboxed metadata with subtle dot separators (`AC Sleeper (2+1) · 4.8 ★ · 24 seats left`).
  - No decorative code comments, no fake latency tickers, no floating badges.

---

## 3. Key Product Decisions & Trade-Offs

- **Temporary Seat Locking**:
  - *Chosen Approach*: 10-minute pessimistic hold lock stored with session ID and expiry timestamp in the backend. Expired holds automatically release back into the available pool.
  - *Why*: Eliminates race conditions when two users click the same sleeper berth simultaneously.
- **Dual-Ready Backend Architecture**:
  - *Chosen Approach*: Fully functional Express server mounted with Vite in the preview environment + complete Java 17 Spring Boot Maven project in `/backend-spring-boot` with matching endpoints (`/api/auth/*`, `/api/buses/*`, `/api/bookings/*`, `/api/admin/*`, `/api/payments/*`).
  - *Why*: The AI Studio container runs Node 22 without native Java/MySQL installed; this architecture ensures the app works immediately in the browser while providing the exact requested Spring Boot & MySQL project files for Windows.
- **PDF Generation**:
  - *Chosen Approach*: Client-side vector PDF generation using `jspdf` and `html2canvas` paired with backend JSON ticket manifests.
  - *Why*: Delivers crisp, downloadable, vector-rendered A4 tickets directly in the browser without serverless rendering overhead.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React SPA (Vite + Tailwind)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ Search &     │  │ Interactive  │  │ Razorpay     │  │ PDF Ticket  │ │
│  │ Results Grid │  │ Seat Matrix  │  │ Checkout     │  │ Generator   │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
│         │                 │                 │                 │        │
│  ┌──────┴─────────────────┴─────────────────┴─────────────────┴──────┐ │
│  │                     BMB API Client (Axios / Fetch)                │ │
└─────────┼──────────────────────────────────────────────────────────────┘
          │ (JWT Bearer Auth / REST API)
┌─────────▼──────────────────────────────────────────────────────────────┐
│                    API Layer (Preview & Local Dual)                    │
│                                                                        │
│  [Preview Runtime: Node.js Express server.ts]                          │
│  ├── /api/auth (Login, Register, Profile, Token Refresh)              │
│  ├── /api/buses (Search, Details, Seats, Boarding Points)             │
│  ├── /api/bookings (Lock Seats, Create, Verify, Cancel, History)       │
│  ├── /api/tracking (Live GPS Waypoints, Speed, ETA)                   │
│  └── /api/admin (Manage Buses, Routes, Pricing, Manifests)            │
│                                                                        │
│  [Windows Production: Java Spring Boot /backend-spring-boot]          │
│  ├── SecurityConfig + JwtAuthenticationFilter                          │
│  ├── BusController, BookingController, PaymentController             │
│  └── MySQL Database (users, buses, schedules, seats, bookings)        │
└────────────────────────────────────────────────────────────────────────┘
```

### Relational Database Schema (MySQL & SQLite)

- **`users`**: `id`, `name`, `email`, `password_hash`, `phone`, `role` (`ROLE_USER`, `ROLE_ADMIN`), `created_at`
- **`buses`**: `id`, `bus_number`, `operator_name`, `bus_type` (`AC_SLEEPER`, `NON_AC_SEATER`, etc.), `total_seats`, `amenities_json`
- **`routes`**: `id`, `from_city`, `to_city`, `distance_km`, `duration_hours`
- **`schedules`**: `id`, `bus_id`, `route_id`, `departure_time`, `arrival_time`, `base_price`, `journey_date`
- **`boarding_dropping_points`**: `id`, `schedule_id`, `type` (`BOARDING`, `DROPPING`), `location_name`, `landmark`, `time`
- **`seat_inventory`**: `id`, `schedule_id`, `seat_number`, `deck` (`LOWER`, `UPPER`), `seat_type` (`SEATER`, `SLEEPER`), `status` (`AVAILABLE`, `LOCKED`, `BOOKED`), `locked_by_user_id`, `lock_expires_at`
- **`bookings`**: `id`, `pnr`, `user_id`, `schedule_id`, `total_amount`, `discount_amount`, `payment_id`, `payment_status`, `booking_status` (`CONFIRMED`, `CANCELLED`), `booking_date`
- **`passengers`**: `id`, `booking_id`, `name`, `age`, `gender`, `seat_number`
- **`cancellations`**: `id`, `booking_id`, `cancellation_date`, `refund_amount`, `refund_status`

---

## 5. Execution Steps

1. **Setup Core Infrastructure & Dependencies**:
   - Install `lucide-react`, `jspdf`, `html2canvas`, `leaflet`, `@types/leaflet`.
   - Configure Tailwind typography, Navy & Orange design tokens, and viewport defaults.
2. **Build Full-Stack Preview Engine (`server.ts`)**:
   - Implement Express backend with in-memory relational store pre-seeded with 10 realistic routes, 15 bus operators (VRL, IntrCity SmartBus, Zingbus, Orange Travels, SRS Travels), dynamic seat configurations, and JWT auth.
   - Add seat lock endpoints with atomic timeouts and race prevention.
   - Add payment verification signature matching Razorpay specification.
3. **Build Spring Boot Project Files (`backend-spring-boot/`)**:
   - Provide complete Maven `pom.xml`, Java source code (Controllers, Services, Repositories, Entities, Security), `schema.sql`, `application.properties`, and Windows CMD/PowerShell setup scripts.
4. **Frontend Architecture & Navigation**:
   - Sticky Top Bar following the 3-zone contract (BMB wordmark, clean links, Login/Profile CTA).
   - High-impact Hero with autocomplete search widget (Swap cities button, calendar picker, passenger counter).
5. **Bus Discovery & Filter Experience**:
   - Search results with live filters (Departure time ranges, Sleeper/Seater, AC, Operators, Price slider).
   - Rich bus cards with operator ratings, amenities, boarding point selector, and expandable seat map.
6. **Interactive Seat Selection Engine**:
   - Visual 2D bus layout with driver cabin, lower deck, upper deck, window seats, and real-time locking feedback countdown timer.
7. **Checkout, Razorpay Simulation & PDF E-Ticket**:
   - Passenger details modal with gender and age collection.
   - Interactive Razorpay test payment modal with instant test-card/UPI success simulation and backend verification.
   - Vector PDF ticket generation with PNR, QR code, route, seat numbers, and print dialog.
8. **My Bookings, Cancellation Engine & Live GPS Tracking**:
   - User bookings dashboard with Upcoming and Completed tabs.
   - Cancellation with rule-based refund percentage display (e.g., >24h = 90%, 12-24h = 70%, <12h = 50%).
   - Live Leaflet map displaying real-time bus GPS movement along highway waypoints with speed and ETA.
9. **Admin Panel**:
   - Admin view to view all bookings, create new buses and routes, manage seat prices, and check passenger manifests.
10. **Windows Setup Guide & Documentation**:
    - Comprehensive `README.md` explaining MySQL local database setup, Spring Boot compilation (`mvn clean spring-boot:run`), and frontend connection.
11. **Verification**:
    - Build validation, TypeScript compilation, and linting.
