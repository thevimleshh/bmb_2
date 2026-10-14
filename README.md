# BMB (Book My Bus) — Full-Stack Bus Ticket Reservation Platform

A complete, production-grade bus reservation application featuring:
- **Real-Time Seat Locking**: 10-minute hold lock preventing race conditions and simultaneous double bookings.
- **Razorpay Test Payment Verification**: Cryptographic HMAC SHA256 signature verification on the backend before ticket generation.
- **Vector PDF E-Tickets**: Printable and downloadable passenger travel vouchers with PNR, boarding landmarks, and QR code.
- **My Bookings & Cancellation Management**: Self-service refund calculations based on departure window rules (>24h: 90%, 12-24h: 70%, 2-12h: 50%).
- **Interactive Live Bus Tracking**: Leaflet & OpenStreetMap GPS highway route tracking with speed and waypoint milestones.
- **Admin Fleet Management**: Manage operators, routes, schedules, base prices, and passenger manifests.

---

## Architecture Overview

1. **AI Studio Preview**:
   - The app runs in this live environment via `server.ts` on port 3000 using Express and Vite middleware.
   - Pre-seeded with realistic routes, schedules, seat inventories, and mock payment simulations.
2. **Local Windows PC Production Setup**:
   - Complete Java 17 Spring Boot 3.2.x REST API in `/backend-spring-boot`.
   - MySQL 8.0+ DDL schema and seeds in `/database/schema.sql`.
   - Step-by-step setup guide in `/docs/windows_setup.md`.

---

## Default Login Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@bmb.com` | `Password123!` |
| **Passenger User** | `rahul@example.com` | `Password123!` |

---

## Quick Start on Windows

1. Run MySQL and import schema:
   ```cmd
   mysql -u root -p < database/schema.sql
   ```
2. Run Spring Boot Backend:
   ```cmd
   cd backend-spring-boot
   mvn clean spring-boot:run
   ```
3. Run React Frontend:
   ```cmd
   npm install
   npm run dev
   ```
Visit `http://localhost:3000` in your browser.
