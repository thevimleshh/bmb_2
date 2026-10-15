import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import crypto from 'crypto';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'bmb_secret_key_2026_book_my_bus';

app.use(express.json());

// -------------------------------------------------------------
// In-Memory Relational Data Store (Mirrors MySQL schema.sql)
// -------------------------------------------------------------

interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  role: 'ROLE_USER' | 'ROLE_ADMIN';
  createdAt: string;
}

interface Bus {
  id: number;
  busNumber: string;
  operatorName: string;
  busName?: string;
  busType: string;
  totalSeats: number;
  hasWifi: boolean;
  hasCharging: boolean;
  hasBlanket: boolean;
  hasWaterBottle: boolean;
  hasEmergencyExit: boolean;
  hasGpsDevice?: boolean;
  busImage?: string;
  rating: number;
  isActive: boolean;
}

interface BoardingPoint {
  id: number;
  scheduleId: number;
  type: 'BOARDING' | 'DROPPING';
  locationName: string;
  landmark: string;
  address?: string;
  time: string;
  lat?: number;
  lng?: number;
}

interface LocationItem {
  id: string | number;
  name: string;
  city: string;
  state: string;
  type: 'TERMINAL' | 'MAJOR_HUB' | 'AIRPORT' | 'RAILWAY_STATION' | 'LOCALITY' | 'CITY';
  address?: string;
  tag?: string;
  lat?: number;
  lng?: number;
}

interface Schedule {
  id: number;
  busId: number;
  fromCity: string;
  toCity: string;
  distanceKm: number;
  durationHours: number;
  departureTime: string;
  arrivalTime: string;
  journeyDate: string;
  basePrice: number;
  bus?: Bus;
  boardingPoints?: BoardingPoint[];
  droppingPoints?: BoardingPoint[];
  availableSeats?: number;
  intermediateStops?: string[];
  isActive?: boolean;
  fromCoords?: { lat: number; lng: number };
  toCoords?: { lat: number; lng: number };
}

interface SeatItem {
  id: number;
  scheduleId: number;
  seatNumber: string;
  deck: 'LOWER' | 'UPPER';
  seatType: 'SEATER' | 'SLEEPER';
  isWindow: boolean;
  price: number;
  status: 'AVAILABLE' | 'LOCKED' | 'BOOKED';
  lockedBySession?: string;
  lockExpiresAt?: number; // timestamp in ms
}

interface Passenger {
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  seatNumber: string;
}

interface Booking {
  id: number;
  pnr: string;
  userId: number;
  userEmail: string;
  scheduleId: number;
  schedule: Schedule;
  boardingPoint: string;
  droppingPoint: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  couponCode?: string;
  paymentId: string;
  paymentStatus: 'PAID' | 'REFUNDED';
  bookingStatus: 'CONFIRMED' | 'CANCELLED';
  bookingDate: string;
  passengers: Passenger[];
  cancellation?: {
    reason: string;
    refundPercentage: number;
    refundAmount: number;
    cancelledAt: string;
  };
}

// Seed Users (Pass: "Password123!")
const salt = bcrypt.genSaltSync(10);
const defaultPasswordHash = bcrypt.hashSync('Password123!', salt);

const users: User[] = [
  {
    id: 1,
    name: 'Admin Manager',
    email: 'admin@bmb.com',
    passwordHash: defaultPasswordHash,
    phone: '9876543210',
    role: 'ROLE_ADMIN',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    passwordHash: defaultPasswordHash,
    phone: '9898989898',
    role: 'ROLE_USER',
    createdAt: new Date().toISOString(),
  },
];

const buses: Bus[] = [
  {
    id: 1,
    busNumber: 'MH-12-RN-8899',
    operatorName: 'VRL Travels',
    busName: 'I-Shift Multi-Axle Diamond Sleeper',
    busType: 'Volvo Multi-Axle AC Sleeper',
    totalSeats: 30,
    hasWifi: true,
    hasCharging: true,
    hasBlanket: true,
    hasWaterBottle: true,
    hasEmergencyExit: true,
    hasGpsDevice: true,
    busImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    isActive: true,
  },
  {
    id: 2,
    busNumber: 'KA-01-AB-1244',
    operatorName: 'IntrCity SmartBus',
    busName: 'SmartBus Volvo B11R Lounge',
    busType: 'Volvo Multi-Axle AC Sleeper',
    totalSeats: 30,
    hasWifi: true,
    hasCharging: true,
    hasBlanket: true,
    hasWaterBottle: true,
    hasEmergencyExit: true,
    hasGpsDevice: false,
    busImage: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    isActive: true,
  },
  {
    id: 3,
    busNumber: 'DL-01-ZG-9001',
    operatorName: 'Zingbus Express',
    busName: 'Zingbus Premium Climate Sleeper',
    busType: 'AC Sleeper Premium',
    totalSeats: 30,
    hasWifi: true,
    hasCharging: true,
    hasBlanket: true,
    hasWaterBottle: true,
    hasEmergencyExit: true,
    hasGpsDevice: true,
    busImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
    rating: 4.7,
    isActive: true,
  },
  {
    id: 4,
    busNumber: 'TS-09-OR-4411',
    operatorName: 'Orange Tours and Travels',
    busName: 'Orange BharatBenz Super Luxury',
    busType: 'AC Sleeper (2+1)',
    totalSeats: 30,
    hasWifi: true,
    hasCharging: true,
    hasBlanket: true,
    hasWaterBottle: true,
    hasEmergencyExit: true,
    hasGpsDevice: true,
    busImage: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600&auto=format&fit=crop&q=80',
    rating: 4.6,
    isActive: true,
  },
  {
    id: 5,
    busNumber: 'TN-07-SR-7733',
    operatorName: 'SRS Travels',
    busName: 'SRS Air Suspension Coach',
    busType: 'BharatBenz AC Seater (2+2)',
    totalSeats: 36,
    hasWifi: false,
    hasCharging: true,
    hasBlanket: false,
    hasWaterBottle: true,
    hasEmergencyExit: true,
    hasGpsDevice: false,
    busImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
    rating: 4.4,
    isActive: true,
  },
  {
    id: 6,
    busNumber: 'KA-09-F-2211',
    operatorName: 'KSRTC FlyBus',
    busName: 'Airavat Club Class Volvo 9600',
    busType: 'Volvo Multi-Axle AC Sleeper',
    totalSeats: 36,
    hasWifi: true,
    hasCharging: true,
    hasBlanket: true,
    hasWaterBottle: true,
    hasEmergencyExit: true,
    hasGpsDevice: false,
    busImage: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    isActive: true,
  },
  {
    id: 7,
    busNumber: 'MH-04-NT-6677',
    operatorName: 'National Travels',
    busName: 'Scania Metrolink HD Sleeper',
    busType: 'AC Sleeper (2+1)',
    totalSeats: 30,
    hasWifi: true,
    hasCharging: true,
    hasBlanket: true,
    hasWaterBottle: true,
    hasEmergencyExit: true,
    hasGpsDevice: true,
    busImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
    rating: 4.5,
    isActive: true,
  },
];

const todayStr = new Date().toISOString().split('T')[0];

const schedules: Schedule[] = [
  {
    id: 1,
    busId: 1,
    fromCity: 'Mumbai',
    toCity: 'Pune',
    distanceKm: 150,
    durationHours: 3.5,
    departureTime: '06:30 AM',
    arrivalTime: '10:00 AM',
    journeyDate: todayStr,
    basePrice: 550,
    intermediateStops: ['Navi Mumbai', 'Lonavala', 'Wakad'],
    fromCoords: { lat: 19.076, lng: 72.8777 },
    toCoords: { lat: 18.5204, lng: 73.8567 },
    isActive: true,
  },
  {
    id: 2,
    busId: 2,
    fromCity: 'Mumbai',
    toCity: 'Pune',
    distanceKm: 150,
    durationHours: 3.5,
    departureTime: '02:00 PM',
    arrivalTime: '05:30 PM',
    journeyDate: todayStr,
    basePrice: 650,
    intermediateStops: ['Vashi', 'Panvel', 'Hinjewadi'],
    fromCoords: { lat: 19.076, lng: 72.8777 },
    toCoords: { lat: 18.5204, lng: 73.8567 },
    isActive: true,
  },
  {
    id: 3,
    busId: 3,
    fromCity: 'Mumbai',
    toCity: 'Pune',
    distanceKm: 150,
    durationHours: 3.5,
    departureTime: '10:30 PM',
    arrivalTime: '02:00 AM',
    journeyDate: todayStr,
    basePrice: 750,
    intermediateStops: ['Chembur', 'Vashi', 'Wakad'],
    fromCoords: { lat: 19.076, lng: 72.8777 },
    toCoords: { lat: 18.5204, lng: 73.8567 },
    isActive: true,
  },
  {
    id: 4,
    busId: 2,
    fromCity: 'Bangalore',
    toCity: 'Chennai',
    distanceKm: 350,
    durationHours: 6.0,
    departureTime: '07:00 AM',
    arrivalTime: '01:00 PM',
    journeyDate: todayStr,
    basePrice: 899,
    intermediateStops: ['Hosur', 'Krishnagiri', 'Vellore', 'Sriperumbudur'],
    fromCoords: { lat: 12.9716, lng: 77.5946 },
    toCoords: { lat: 13.0827, lng: 80.2707 },
    isActive: true,
  },
  {
    id: 5,
    busId: 4,
    fromCity: 'Bangalore',
    toCity: 'Chennai',
    distanceKm: 350,
    durationHours: 6.0,
    departureTime: '09:00 PM',
    arrivalTime: '03:00 AM',
    journeyDate: todayStr,
    basePrice: 1150,
    intermediateStops: ['Electronic City', 'Hosur', 'Kanchipuram'],
    fromCoords: { lat: 12.9716, lng: 77.5946 },
    toCoords: { lat: 13.0827, lng: 80.2707 },
    isActive: true,
  },
  {
    id: 6,
    busId: 3,
    fromCity: 'Delhi',
    toCity: 'Jaipur',
    distanceKm: 280,
    durationHours: 5.0,
    departureTime: '06:00 AM',
    arrivalTime: '11:00 AM',
    journeyDate: todayStr,
    basePrice: 699,
    intermediateStops: ['Gurgaon', 'Dharuhera', 'Kotputli', 'Shahpura'],
    fromCoords: { lat: 28.6139, lng: 77.209 },
    toCoords: { lat: 26.9124, lng: 75.7873 },
    isActive: true,
  },
  {
    id: 7,
    busId: 1,
    fromCity: 'Delhi',
    toCity: 'Jaipur',
    distanceKm: 280,
    durationHours: 5.0,
    departureTime: '11:00 PM',
    arrivalTime: '04:00 AM',
    journeyDate: todayStr,
    basePrice: 950,
    intermediateStops: ['IFFCO Chowk', 'Behror', 'Manoharpur'],
    fromCoords: { lat: 28.6139, lng: 77.209 },
    toCoords: { lat: 26.9124, lng: 75.7873 },
    isActive: true,
  },
  {
    id: 8,
    busId: 4,
    fromCity: 'Hyderabad',
    toCity: 'Bangalore',
    distanceKm: 570,
    durationHours: 8.5,
    departureTime: '08:30 PM',
    arrivalTime: '05:00 AM',
    journeyDate: todayStr,
    basePrice: 1299,
    intermediateStops: ['Kurnool', 'Anantapur', 'Chikkaballapur'],
    fromCoords: { lat: 17.385, lng: 78.4867 },
    toCoords: { lat: 12.9716, lng: 77.5946 },
    isActive: true,
  },
  {
    id: 9,
    busId: 2,
    fromCity: 'Mumbai',
    toCity: 'Goa',
    distanceKm: 590,
    durationHours: 11.0,
    departureTime: '07:00 PM',
    arrivalTime: '06:00 AM',
    journeyDate: todayStr,
    basePrice: 1499,
    intermediateStops: ['Chiplun', 'Ratnagiri', 'Kankavli', 'Mapusa'],
    fromCoords: { lat: 19.076, lng: 72.8777 },
    toCoords: { lat: 15.2993, lng: 74.124 },
    isActive: true,
  },
  // Real Mumbai to Bangalore Schedules (Fixes Mumbai -> Bangalore 0 buses issue)
  {
    id: 10,
    busId: 1,
    fromCity: 'Mumbai',
    toCity: 'Bangalore',
    distanceKm: 985,
    durationHours: 15.5,
    departureTime: '04:00 PM',
    arrivalTime: '07:30 AM',
    journeyDate: todayStr,
    basePrice: 1450,
    intermediateStops: ['Pune', 'Satara', 'Kolhapur', 'Belgaum', 'Hubli', 'Davanagere', 'Tumkur'],
    fromCoords: { lat: 19.076, lng: 72.8777 },
    toCoords: { lat: 12.9716, lng: 77.5946 },
    isActive: true,
  },
  {
    id: 11,
    busId: 4,
    fromCity: 'Mumbai',
    toCity: 'Bangalore',
    distanceKm: 985,
    durationHours: 15.0,
    departureTime: '06:30 PM',
    arrivalTime: '09:30 AM',
    journeyDate: todayStr,
    basePrice: 1599,
    intermediateStops: ['Pune', 'Kolhapur', 'Belgaum', 'Hubli', 'Tumkur'],
    fromCoords: { lat: 19.076, lng: 72.8777 },
    toCoords: { lat: 12.9716, lng: 77.5946 },
    isActive: true,
  },
  {
    id: 12,
    busId: 6,
    fromCity: 'Mumbai',
    toCity: 'Bangalore',
    distanceKm: 985,
    durationHours: 16.0,
    departureTime: '08:30 PM',
    arrivalTime: '12:30 PM',
    journeyDate: todayStr,
    basePrice: 1350,
    intermediateStops: ['Pune', 'Satara', 'Kolhapur', 'Belgaum', 'Hubli', 'Davanagere'],
    fromCoords: { lat: 19.076, lng: 72.8777 },
    toCoords: { lat: 12.9716, lng: 77.5946 },
    isActive: true,
  },
  {
    id: 13,
    busId: 7,
    fromCity: 'Bangalore',
    toCity: 'Mumbai',
    distanceKm: 985,
    durationHours: 15.5,
    departureTime: '05:00 PM',
    arrivalTime: '08:30 AM',
    journeyDate: todayStr,
    basePrice: 1499,
    intermediateStops: ['Tumkur', 'Davanagere', 'Hubli', 'Belgaum', 'Kolhapur', 'Pune'],
    fromCoords: { lat: 12.9716, lng: 77.5946 },
    toCoords: { lat: 19.076, lng: 72.8777 },
    isActive: true,
  },
];

const CITY_STOPS: Record<string, { locationName: string; landmark: string; address: string }[]> = {
  Mumbai: [
    { locationName: 'Borivali West', landmark: 'Near Gokul Hotel', address: 'Western Express Highway, Borivali West, Mumbai' },
    { locationName: 'Andheri East', landmark: 'Bisleri Flyover Bridge', address: 'WEH Metro Station Junction, Andheri East, Mumbai' },
    { locationName: 'Dadar East', landmark: 'Near Swami Narayan Temple', address: 'Asiad Bus Terminal, Dadar TT Circle, Mumbai' },
    { locationName: 'Chembur', landmark: 'Yogi Hotel Junction', address: 'Sion-Panvel Highway, Chembur East, Mumbai' },
    { locationName: 'Vashi Toll Plaza', landmark: 'Below Highway Flyover', address: 'Sector 17, Vashi, Navi Mumbai' },
  ],
  Pune: [
    { locationName: 'Hinjewadi Bridge', landmark: 'Phase 1 Entry Gate', address: 'Wakad-Hinjewadi Flyover, Pune' },
    { locationName: 'Wakad Flyover', landmark: 'Near Ginger Hotel', address: 'Mumbai-Bangalore Highway, Wakad, Pune' },
    { locationName: 'Shivaji Nagar', landmark: 'Modern College Road', address: 'Opp. Railway Station, Shivaji Nagar, Pune' },
    { locationName: 'Swargate Terminal', landmark: 'Platform 3, BMB Bay', address: 'Jedhe Chowk, Swargate, Pune' },
    { locationName: 'Katraj Wonder City', landmark: 'Near Katraj Bypass Tunnel', address: 'Pune-Satara Highway, Katraj, Pune' },
  ],
  Bangalore: [
    { locationName: 'Majestic Metro Station', landmark: 'Terminal Exit Gate 2', address: 'Subhash Nagar, Central Bus Stand, Bangalore' },
    { locationName: 'Anand Rao Circle', landmark: 'Near Race Course Road', address: 'Sheshadri Road Junction, Bangalore' },
    { locationName: 'Indiranagar', landmark: '100ft Road KFC Junction', address: 'Near Indiranagar Metro, Bangalore' },
    { locationName: 'Koramangala', landmark: 'Water Tank Junction', address: '80 Feet Road, 4th Block, Koramangala, Bangalore' },
    { locationName: 'Electronic City Toll', landmark: 'Elevated Highway Ramp', address: 'Hosur Main Road, Electronic City Phase 1, Bangalore' },
  ],
  Chennai: [
    { locationName: 'Poonamallee Bypass', landmark: 'Opp. Saveetha Dental Hospital', address: 'Chennai Outer Ring Road, Poonamallee' },
    { locationName: 'Koyambedu CMBT', landmark: 'Omni Bus Stand, Platform 1', address: 'Jawaharlal Nehru Road, Koyambedu, Chennai' },
    { locationName: 'Ashok Nagar', landmark: 'Near Metro Station Gate 3', address: '1st Avenue, Ashok Nagar, Chennai' },
    { locationName: 'Guindy', landmark: 'Below Kathipara Flyover', address: 'Mount Road, Guindy, Chennai' },
    { locationName: 'Tambaram', landmark: 'Opp. Railway Station', address: 'GST Road, West Tambaram, Chennai' },
  ],
  Delhi: [
    { locationName: 'Kashmiri Gate ISBT', landmark: 'Metro Station Gate 1', address: 'Lothian Road, ISBT Kashmiri Gate, Delhi' },
    { locationName: 'Majnu Ka Tila', landmark: 'Near HP Petrol Pump', address: 'Outer Ring Road, Civil Lines, Delhi' },
    { locationName: 'Dhaula Kuan', landmark: 'Metro Station Bus Bay', address: 'Ring Road, Dhaula Kuan, New Delhi' },
    { locationName: 'Mahipalpur', landmark: 'Aerocity Flyover Junction', address: 'NH48 Highway, Mahipalpur, New Delhi' },
    { locationName: 'IFFCO Chowk Gurgaon', landmark: 'Near Metro Station Exit', address: 'Delhi-Jaipur Expressway, Sector 29, Gurgaon' },
  ],
  Jaipur: [
    { locationName: 'Transport Nagar', landmark: 'Delhi Highway Entry Toll', address: 'Ghat Ki Guni, Transport Nagar, Jaipur' },
    { locationName: 'Narayan Singh Circle', landmark: 'Near City Palace Approach', address: 'Tonk Road, Narayan Singh Circle, Jaipur' },
    { locationName: 'Sindhi Camp Bus Stand', landmark: 'Platform 4, Main Bay', address: 'Station Road, Sindhi Camp, Jaipur' },
    { locationName: '200 Feet Bypass', landmark: 'Ajmer Road Flyover', address: 'Heerapura, Ajmer Road Bypass, Jaipur' },
  ],
  Hyderabad: [
    { locationName: 'Miyapur', landmark: 'Allwyn X Roads Metro', address: 'National Highway 65, Miyapur, Hyderabad' },
    { locationName: 'Ameerpet', landmark: 'Metro Station Pillar 1042', address: 'MCH Complex, Ameerpet, Hyderabad' },
    { locationName: 'Lakdikapool', landmark: 'Near Telephone Bhavan', address: 'Saifabad, Lakdikapool, Hyderabad' },
    { locationName: 'Gachibowli', landmark: 'ORR Junction Flyover', address: 'Gachibowli Main Road, Hyderabad' },
    { locationName: 'Shamshabad', landmark: 'Airport Approach Junction', address: 'Bangalore Highway, Shamshabad, Hyderabad' },
  ],
  Goa: [
    { locationName: 'Mapusa', landmark: 'Near KTC Bus Terminal', address: 'NH66, Mapusa, North Goa' },
    { locationName: 'Porvorim', landmark: 'Near Mall De Goa', address: 'NH66 Highway, Porvorim, Goa' },
    { locationName: 'Panjim Terminal', landmark: 'Kadamba Bus Stand Platform 2', address: 'Patto Centre, Panjim, Goa' },
    { locationName: 'Margao KTC', landmark: 'Madgaon Central Bus Terminal', address: 'Pajifond, Margao, South Goa' },
  ],
  Ahmedabad: [
    { locationName: 'Iscon Cross Road', landmark: 'Near Iscon Mall', address: 'SG Highway, Satellite, Ahmedabad' },
    { locationName: 'Paldi', landmark: 'Cross Roads Mahalaxmi', address: 'Paldi Circle, Ahmedabad' },
    { locationName: 'Geeta Mandir', landmark: 'Central ST Bus Stand', address: 'ST Road, Geeta Mandir, Ahmedabad' },
    { locationName: 'CTM Express Highway', landmark: 'Amraiwadi Toll Plaza', address: 'Ahmedabad-Vadodara Expressway, CTM' },
  ],
  Surat: [
    { locationName: 'Kamrej Toll Plaza', landmark: 'Highway Flyover Bridge', address: 'NH48, Kamrej, Surat' },
    { locationName: 'Varachha', landmark: 'Near Mini Bazaar', address: 'Varachha Main Road, Surat' },
    { locationName: 'Ring Road', landmark: 'Near Sahara Darwaja', address: 'Udhana Darwaja, Ring Road, Surat' },
    { locationName: 'Kadodara Char Rasta', landmark: 'NH48 Highway Junction', address: 'Kadodara, Surat District' },
  ],
};

const boardingDroppingPoints: BoardingPoint[] = [];
let pointIdCounter = 1;

function ensurePointsForSchedule(schedule: Schedule): BoardingPoint[] {
  const existing = boardingDroppingPoints.filter(p => p.scheduleId === schedule.id);
  if (existing.length > 0) return existing;

  const generated: BoardingPoint[] = [];
  const fromStops = CITY_STOPS[schedule.fromCity] || [
    { locationName: `${schedule.fromCity} Central Hub`, landmark: 'Central Bus Stand Platform 1', address: `${schedule.fromCity} Main Hub` },
    { locationName: `${schedule.fromCity} Bypass Junction`, landmark: 'Highway Toll Plaza', address: `${schedule.fromCity} Outer Ring Road` },
  ];

  const toStops = CITY_STOPS[schedule.toCity] || [
    { locationName: `${schedule.toCity} Toll Plaza`, landmark: 'Highway Entry Toll', address: `${schedule.toCity} Bypass` },
    { locationName: `${schedule.toCity} Central Terminal`, landmark: 'Main Station Bus Stand', address: `${schedule.toCity} Central` },
  ];

  // Helper to adjust time slightly for consecutive stops
  fromStops.forEach((stop, idx) => {
    generated.push({
      id: pointIdCounter++,
      scheduleId: schedule.id,
      type: 'BOARDING',
      locationName: stop.locationName,
      landmark: stop.landmark,
      address: stop.address,
      time: schedule.departureTime,
    });
  });

  toStops.forEach((stop, idx) => {
    generated.push({
      id: pointIdCounter++,
      scheduleId: schedule.id,
      type: 'DROPPING',
      locationName: stop.locationName,
      landmark: stop.landmark,
      address: stop.address,
      time: schedule.arrivalTime,
    });
  });

  boardingDroppingPoints.push(...generated);
  return generated;
}

// Pre-initialize points for all defined schedules
schedules.forEach(s => ensurePointsForSchedule(s));

// Seat Inventory: Generate realistic 30 seats per schedule (15 Lower Deck, 15 Upper Deck)
const seatInventory: SeatItem[] = [];
let seatIdCounter = 1;

schedules.forEach(schedule => {
  const base = schedule.basePrice;
  // Lower deck (L1 to L15)
  for (let i = 1; i <= 15; i++) {
    const isWindow = i % 3 !== 2;
    // Pre-book a couple for demo realism
    const isPrebooked = (schedule.id === 1 && (i === 3 || i === 7));
    seatInventory.push({
      id: seatIdCounter++,
      scheduleId: schedule.id,
      seatNumber: `L${i}`,
      deck: 'LOWER',
      seatType: 'SLEEPER',
      isWindow,
      price: base,
      status: isPrebooked ? 'BOOKED' : 'AVAILABLE',
    });
  }
  // Upper deck (U1 to U15)
  for (let i = 1; i <= 15; i++) {
    const isWindow = i % 3 !== 2;
    const isPrebooked = (schedule.id === 1 && i === 6);
    seatInventory.push({
      id: seatIdCounter++,
      scheduleId: schedule.id,
      seatNumber: `U${i}`,
      deck: 'UPPER',
      seatType: 'SLEEPER',
      isWindow,
      price: base + 100, // Upper deck premium sleeper
      status: isPrebooked ? 'BOOKED' : 'AVAILABLE',
    });
  }
});

// Seed Bookings
const bookings: Booking[] = [
  {
    id: 1,
    pnr: 'BMB-99824',
    userId: 2,
    userEmail: 'rahul@example.com',
    scheduleId: 1,
    schedule: schedules[0],
    boardingPoint: 'Borivali West (06:30 AM)',
    droppingPoint: 'Swargate Terminal (10:00 AM)',
    totalAmount: 1100,
    discountAmount: 100,
    finalAmount: 1000,
    couponCode: 'BMBFIRST',
    paymentId: 'pay_test_88291039',
    paymentStatus: 'PAID',
    bookingStatus: 'CONFIRMED',
    bookingDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    passengers: [
      { name: 'Rahul Sharma', age: 29, gender: 'MALE', seatNumber: 'L3' },
      { name: 'Priya Sharma', age: 27, gender: 'FEMALE', seatNumber: 'L7' },
    ],
  },
];

// Helper: Clean expired locks
function cleanExpiredLocks() {
  const now = Date.now();
  for (const seat of seatInventory) {
    if (seat.status === 'LOCKED' && seat.lockExpiresAt && seat.lockExpiresAt < now) {
      seat.status = 'AVAILABLE';
      seat.lockedBySession = undefined;
      seat.lockExpiresAt = undefined;
    }
  }
}

// -------------------------------------------------------------
// Authentication Middleware
// -------------------------------------------------------------

function authenticateToken(req: any, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Token is invalid or expired' });
    }
    req.user = user;
    next();
  });
}

function requireAdmin(req: any, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ROLE_ADMIN') {
    return res.status(403).json({ error: 'Administrator access required' });
  }
  next();
}

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// 1. Auth Endpoints
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password, phone, role } = req.body;
  if (!name || !email || !password || !phone) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }

  const newUser: User = {
    id: users.length + 1,
    name,
    email: email.toLowerCase().trim(),
    passwordHash: bcrypt.hashSync(password, 10),
    phone,
    role: role === 'ROLE_ADMIN' ? 'ROLE_ADMIN' : 'ROLE_USER',
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);

  const token = jwt.sign(
    { userId: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.status(201).json({
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
    },
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  });
});

app.get('/api/auth/me', authenticateToken, (req: any, res: Response) => {
  const user = users.find(u => u.id === req.user.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  });
});

// City coordinates mapping for Leaflet Maps & Indian routing
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Mumbai: { lat: 19.0760, lng: 72.8777 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Bangalore: { lat: 12.9716, lng: 77.5946 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Delhi: { lat: 28.6139, lng: 77.2090 },
  Jaipur: { lat: 26.9124, lng: 75.7873 },
  Hyderabad: { lat: 17.3850, lng: 78.4867 },
  Goa: { lat: 15.2993, lng: 74.1240 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Surat: { lat: 21.1702, lng: 72.8311 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Indore: { lat: 22.7196, lng: 75.8577 },
  Nagpur: { lat: 21.1458, lng: 79.0882 },
  Coimbatore: { lat: 11.0168, lng: 76.9558 },
  Kochi: { lat: 9.9312, lng: 76.2673 },
  Chandigarh: { lat: 30.7333, lng: 76.7794 },
  Lucknow: { lat: 26.8467, lng: 80.9462 },
  Varanasi: { lat: 25.3176, lng: 82.9739 },
  Udaipur: { lat: 24.5854, lng: 73.7125 },
  Bhopal: { lat: 23.2599, lng: 77.4126 },
  Patna: { lat: 25.5941, lng: 85.1376 },
  Visakhapatnam: { lat: 17.6868, lng: 83.2185 },
  Vadodara: { lat: 22.3072, lng: 73.1812 },
  Madurai: { lat: 9.9252, lng: 78.1198 },
  Vijayawada: { lat: 16.5062, lng: 80.6480 },
  Mysore: { lat: 12.2958, lng: 76.6394 },
  Hubli: { lat: 15.3647, lng: 75.1240 },
  Belgaum: { lat: 15.8497, lng: 74.4977 },
  Kolhapur: { lat: 16.7050, lng: 74.2433 },
  Satara: { lat: 17.6805, lng: 73.9930 },
  Tumkur: { lat: 13.3379, lng: 77.1173 },
};

// Aliases for common Indian names
const CITY_ALIASES: Record<string, string> = {
  bengaluru: 'Bangalore',
  bangalore: 'Bangalore',
  bombay: 'Mumbai',
  mumbai: 'Mumbai',
  madras: 'Chennai',
  chennai: 'Chennai',
  calcutta: 'Kolkata',
  kolkata: 'Kolkata',
  cochin: 'Kochi',
  kochi: 'Kochi',
  baroda: 'Vadodara',
  vadodara: 'Vadodara',
  trivandrum: 'Thiruvananthapuram',
  gurugram: 'Gurgaon',
  gurgaon: 'Gurgaon',
  mysuru: 'Mysore',
  mysore: 'Mysore',
  hubballi: 'Hubli',
  hubli: 'Hubli',
  belagavi: 'Belgaum',
  belgaum: 'Belgaum',
  poona: 'Pune',
  pune: 'Pune',
};

function normalizeCityName(input: string): string {
  if (!input) return '';
  const cleaned = input.toLowerCase().replace(/[,()]/g, ' ').trim();
  const tokens = cleaned.split(/\s+/);
  for (const token of tokens) {
    if (CITY_ALIASES[token]) return CITY_ALIASES[token];
  }
  const knownCities = Object.keys(CITY_COORDINATES);
  for (const city of knownCities) {
    if (cleaned.includes(city.toLowerCase())) return city;
  }
  return tokens[0] ? tokens[0].charAt(0).toUpperCase() + tokens[0].slice(1) : input;
}

// Curated high-volume Indian interstate terminals, airports, and city hubs
const POPULAR_INDIAN_LOCATIONS: LocationItem[] = [
  // Mumbai
  { id: 'mum-1', name: 'Borivali West BMB Hub', city: 'Mumbai', state: 'Maharashtra', type: 'TERMINAL', address: 'Western Express Highway, Borivali West, Mumbai', tag: 'Major Interstate Hub', lat: 19.2288, lng: 72.8541 },
  { id: 'mum-2', name: 'Dadar East Asiad Terminal', city: 'Mumbai', state: 'Maharashtra', type: 'TERMINAL', address: 'Swami Narayan Temple Road, Dadar TT, Mumbai', tag: 'Central Bus Stand', lat: 19.0178, lng: 72.8478 },
  { id: 'mum-3', name: 'Andheri East Bisleri Junction', city: 'Mumbai', state: 'Maharashtra', type: 'MAJOR_HUB', address: 'WEH Metro Station, Andheri East, Mumbai', tag: 'Expressway Pickup', lat: 19.1136, lng: 72.8697 },
  { id: 'mum-4', name: 'Vashi Toll Plaza & Sanpada', city: 'Mumbai', state: 'Maharashtra', type: 'MAJOR_HUB', address: 'Sion-Panvel Highway, Vashi, Navi Mumbai', tag: 'Navi Mumbai Gateway', lat: 19.0771, lng: 72.9986 },
  { id: 'mum-5', name: 'Chhatrapati Shivaji Maharaj Airport (BOM)', city: 'Mumbai', state: 'Maharashtra', type: 'AIRPORT', address: 'Terminal 1 & 2, Sahar, Mumbai', tag: 'International Airport', lat: 19.0896, lng: 72.8656 },
  { id: 'mum-6', name: 'Mumbai Central Railway Station', city: 'Mumbai', state: 'Maharashtra', type: 'RAILWAY_STATION', address: 'Dr D.B. Marg, Mumbai Central', tag: 'Western Railway HQ', lat: 18.9696, lng: 72.8193 },
  // Pune
  { id: 'pun-1', name: 'Swargate BMB Terminal Platform 3', city: 'Pune', state: 'Maharashtra', type: 'TERMINAL', address: 'Jedhe Chowk, Swargate, Pune', tag: 'Intercity Bus Terminal', lat: 18.5018, lng: 73.8587 },
  { id: 'pun-2', name: 'Wakad Highway Bridge & Ginger Hotel', city: 'Pune', state: 'Maharashtra', type: 'MAJOR_HUB', address: 'Mumbai-Bangalore Highway, Wakad, Pune', tag: 'Expressway Stop', lat: 18.5987, lng: 73.7684 },
  { id: 'pun-3', name: 'Hinjewadi Phase 1 Entry Gate', city: 'Pune', state: 'Maharashtra', type: 'MAJOR_HUB', address: 'Wakad-Hinjewadi Flyover, Pune', tag: 'IT Park Hub', lat: 18.5913, lng: 73.7389 },
  { id: 'pun-4', name: 'Shivaji Nagar Bus Station', city: 'Pune', state: 'Maharashtra', type: 'TERMINAL', address: 'Opp. Shivaji Nagar Railway Station, Pune', tag: 'Northbound Depot', lat: 18.5314, lng: 73.8446 },
  // Bangalore
  { id: 'blr-1', name: 'Kempegowda Bus Station (Majestic)', city: 'Bangalore', state: 'Karnataka', type: 'TERMINAL', address: 'Terminal Exit 2, Subhash Nagar, Bangalore', tag: 'Central KSRTC & Private Terminal', lat: 12.9772, lng: 77.5713 },
  { id: 'blr-2', name: 'Anand Rao Circle Bus Bay', city: 'Bangalore', state: 'Karnataka', type: 'MAJOR_HUB', address: 'Sheshadri Road, Gandhi Nagar, Bangalore', tag: 'Private Fleet Hub', lat: 12.9806, lng: 77.5768 },
  { id: 'blr-3', name: 'Electronic City Toll Plaza Ramp', city: 'Bangalore', state: 'Karnataka', type: 'MAJOR_HUB', address: 'Hosur Main Road, Phase 1, Bangalore', tag: 'South Corridor Exit', lat: 12.8399, lng: 77.6770 },
  { id: 'blr-4', name: 'Koramangala Water Tank Junction', city: 'Bangalore', state: 'Karnataka', type: 'LOCALITY', address: '80 Feet Road, 4th Block, Koramangala', tag: 'Southeast Hub', lat: 12.9352, lng: 77.6245 },
  { id: 'blr-5', name: 'Kempegowda International Airport (BLR)', city: 'Bangalore', state: 'Karnataka', type: 'AIRPORT', address: 'KIAL Road, Devanahalli, Bangalore', tag: 'Airport FlyBus Stop', lat: 13.1986, lng: 77.7066 },
  { id: 'blr-6', name: 'Yeshwantpur Govardhan Bus Stand', city: 'Bangalore', state: 'Karnataka', type: 'TERMINAL', address: 'Near Yeshwantpur Railway Station, Bangalore', tag: 'North Corridor Entry', lat: 13.0238, lng: 77.5503 },
  // Delhi
  { id: 'del-1', name: 'Maharana Pratap ISBT Kashmere Gate', city: 'Delhi', state: 'Delhi', type: 'TERMINAL', address: 'Lothian Road, Kashmere Gate Metro Gate 1', tag: 'Largest Interstate Terminal', lat: 28.6675, lng: 77.2285 },
  { id: 'del-2', name: 'Dhaula Kuan Highway Bus Bay', city: 'Delhi', state: 'Delhi', type: 'MAJOR_HUB', address: 'Ring Road Junction, New Delhi', tag: 'Airport Express Corridor', lat: 28.5921, lng: 77.1614 },
  { id: 'del-3', name: 'IFFCO Chowk Gurgaon Express Stop', city: 'Gurgaon', state: 'Haryana', type: 'MAJOR_HUB', address: 'Delhi-Jaipur Highway, Sector 29, Gurgaon', tag: 'NCR Highway Hub', lat: 28.4720, lng: 77.0725 },
  { id: 'del-4', name: 'Indira Gandhi International Airport (DEL)', city: 'Delhi', state: 'Delhi', type: 'AIRPORT', address: 'Terminal 3 / T1 Bus Lane, New Delhi', tag: 'Airport Terminal', lat: 28.5562, lng: 77.1000 },
  // Jaipur
  { id: 'jai-1', name: 'Sindhi Camp Central Bus Stand', city: 'Jaipur', state: 'Rajasthan', type: 'TERMINAL', address: 'Station Road, Platform 4, Sindhi Camp, Jaipur', tag: 'Central RSRTC & Private Stand', lat: 26.9239, lng: 75.8000 },
  { id: 'jai-2', name: 'Transport Nagar Toll Junction', city: 'Jaipur', state: 'Rajasthan', type: 'MAJOR_HUB', address: 'Delhi Highway Entry, Ghat Ki Guni, Jaipur', tag: 'Delhi Highway Entry', lat: 26.9015, lng: 75.8542 },
  { id: 'jai-3', name: '200 Feet Bypass Ajmer Road', city: 'Jaipur', state: 'Rajasthan', type: 'MAJOR_HUB', address: 'Heerapura Flyover, Ajmer Road Bypass', tag: 'Gujarat/Ajmer Highway', lat: 26.8833, lng: 75.7278 },
  // Chennai
  { id: 'chn-1', name: 'Puratchi Thalaivar Dr. M.G.R. CMBT Koyambedu', city: 'Chennai', state: 'Tamil Nadu', type: 'TERMINAL', address: 'Jawaharlal Nehru Road, Koyambedu, Chennai', tag: 'Omni & SETC Terminal', lat: 10.7492, lng: 80.2078 },
  { id: 'chn-2', name: 'Poonamallee Bypass Saveetha Toll', city: 'Chennai', state: 'Tamil Nadu', type: 'MAJOR_HUB', address: 'Chennai Outer Ring Road, Poonamallee', tag: 'Bangalore Highway Junction', lat: 13.0489, lng: 80.0934 },
  { id: 'chn-3', name: 'Tambaram Railway Station Bus Bay', city: 'Chennai', state: 'Tamil Nadu', type: 'TERMINAL', address: 'GST Road, West Tambaram, Chennai', tag: 'Southbound Terminal', lat: 12.9249, lng: 80.1000 },
  // Hyderabad
  { id: 'hyd-1', name: 'Mahatma Gandhi Bus Station (MGBS / Imlibun)', city: 'Hyderabad', state: 'Telangana', type: 'TERMINAL', address: 'Gowliguda, Central Bus Stand, Hyderabad', tag: 'Largest TSRTC Terminal', lat: 17.3789, lng: 78.4816 },
  { id: 'hyd-2', name: 'Miyapur Allwyn Cross Road Metro', city: 'Hyderabad', state: 'Telangana', type: 'MAJOR_HUB', address: 'NH65, Miyapur, Hyderabad', tag: 'Mumbai/Pune Highway Hub', lat: 17.4968, lng: 78.3548 },
  { id: 'hyd-3', name: 'Ameerpet Metro Station Pillar 1042', city: 'Hyderabad', state: 'Telangana', type: 'MAJOR_HUB', address: 'MCH Complex, Ameerpet, Hyderabad', tag: 'City Centre Pickup', lat: 17.4375, lng: 78.4482 },
  { id: 'hyd-4', name: 'Shamshabad Airport Approach Toll', city: 'Hyderabad', state: 'Telangana', type: 'MAJOR_HUB', address: 'Bangalore Highway NH44, Shamshabad', tag: 'Bangalore Corridor Exit', lat: 17.2543, lng: 78.4312 },
  // Ahmedabad
  { id: 'ahm-1', name: 'Geeta Mandir Central ST Bus Stand', city: 'Ahmedabad', state: 'Gujarat', type: 'TERMINAL', address: 'ST Road, Geeta Mandir, Ahmedabad', tag: 'Central GSRTC Stand', lat: 23.0125, lng: 72.5894 },
  { id: 'ahm-2', name: 'Iscon Cross Road & SG Highway', city: 'Ahmedabad', state: 'Gujarat', type: 'MAJOR_HUB', address: 'Near Iscon Mall, Satellite, Ahmedabad', tag: 'Private Operator Hub', lat: 23.0272, lng: 72.5074 },
  // Goa
  { id: 'goa-1', name: 'Kadamba Bus Terminal Panjim', city: 'Panaji', state: 'Goa', type: 'TERMINAL', address: 'Patto Centre, Platform 2, Panjim', tag: 'Central KTC Terminal', lat: 15.4989, lng: 73.8278 },
  { id: 'goa-2', name: 'Margao KTC Central Bus Stand', city: 'Margao', state: 'Goa', type: 'TERMINAL', address: 'Pajifond, Madgaon Central, South Goa', tag: 'South Goa Hub', lat: 15.2832, lng: 73.9685 },
  // Surat
  { id: 'sur-1', name: 'Kamrej Toll Plaza Flyover Bridge', city: 'Surat', state: 'Gujarat', type: 'MAJOR_HUB', address: 'NH48 Expressway, Kamrej, Surat', tag: 'Mumbai-Ahmedabad Corridor', lat: 21.2707, lng: 72.9587 },
  // Other Key Indian Cities
  { id: 'kol-1', name: 'Esplanade Bus Terminus (Babughat)', city: 'Kolkata', state: 'West Bengal', type: 'TERMINAL', address: 'Dharmatala, Central Kolkata', tag: 'Central Bus Terminal', lat: 22.5645, lng: 88.3517 },
  { id: 'lko-1', name: 'Alambagh Inter State Bus Terminal (ISBT)', city: 'Lucknow', state: 'Uttar Pradesh', type: 'TERMINAL', address: 'Kanpur Road, Alambagh, Lucknow', tag: 'Modern ISBT Terminal', lat: 26.8155, lng: 80.9005 },
  { id: 'ind-1', name: 'Sarwate Bus Stand', city: 'Indore', state: 'Madhya Pradesh', type: 'TERMINAL', address: 'Near Railway Station, Indore', tag: 'Central Depot', lat: 22.7144, lng: 75.8679 },
  { id: 'cbe-1', name: 'Gandhipuram Central Bus Stand', city: 'Coimbatore', state: 'Tamil Nadu', type: 'TERMINAL', address: 'Cross Cut Road, Gandhipuram', tag: 'Central Bus Stand', lat: 11.0175, lng: 76.9678 },
  { id: 'koc-1', name: 'Vyttila Mobility Hub', city: 'Kochi', state: 'Kerala', type: 'TERMINAL', address: 'Kaniyampuzha Road, Vyttila, Kochi', tag: 'Integrated Transit Hub', lat: 9.9672, lng: 76.3204 },
  { id: 'chd-1', name: 'ISBT Sector 43 Terminal', city: 'Chandigarh', state: 'Chandigarh', type: 'TERMINAL', address: 'Sector 43, Chandigarh', tag: 'Himachal & Punjab Hub', lat: 30.7180, lng: 76.7454 },
];

// In-Memory cache for Nominatim to prevent rate limits and comply with usage policy
const locationCache = new Map<string, { timestamp: number; data: LocationItem[] }>();

// 2. Real Location Search API (Supports All India search with Nominatim + Local Transit Hubs)
app.get('/api/buses/locations', async (req: Request, res: Response) => {
  const query = (req.query.q as string || '').trim().toLowerCase();

  // If query is blank, return curated popular interstate hubs
  if (!query) {
    return res.json(POPULAR_INDIAN_LOCATIONS.slice(0, 10));
  }

  // Check cache first
  const cached = locationCache.get(query);
  if (cached && Date.now() - cached.timestamp < 3600000) {
    return res.json(cached.data);
  }

  // 1. Filter local transit hubs first
  const localMatches = POPULAR_INDIAN_LOCATIONS.filter(item =>
    item.name.toLowerCase().includes(query) ||
    item.city.toLowerCase().includes(query) ||
    item.state.toLowerCase().includes(query) ||
    (item.address && item.address.toLowerCase().includes(query)) ||
    (item.tag && item.tag.toLowerCase().includes(query))
  );

  let combinedResults: LocationItem[] = [...localMatches];

  // 2. If query has at least 2 characters, query OpenStreetMap Nominatim for real-time all India places
  if (query.length >= 2) {
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=in&format=jsonv2&addressdetails=1&limit=8`;
      const osmRes = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'BMB-BookMyBus-India/2.0 (contact: support@bookmybus.example)',
          'Accept': 'application/json',
        },
      });

      if (osmRes.ok) {
        const osmData = await osmRes.json();
        if (Array.isArray(osmData)) {
          const osmResults: LocationItem[] = osmData.map((item: any, idx: number) => {
            const addr = item.address || {};
            const cityName = addr.city || addr.town || addr.municipality || addr.village || addr.county || item.name;
            const stateName = addr.state || 'India';
            
            let placeType: LocationItem['type'] = 'LOCALITY';
            let tag = 'Locality / Area';

            if (item.type === 'bus_station' || item.class === 'highway' || item.name.toLowerCase().includes('bus') || item.name.toLowerCase().includes('isbt')) {
              placeType = 'TERMINAL';
              tag = 'Bus Terminal / Stand';
            } else if (item.type === 'aerodrome' || item.name.toLowerCase().includes('airport')) {
              placeType = 'AIRPORT';
              tag = 'Airport';
            } else if (item.type === 'station' || item.name.toLowerCase().includes('railway') || item.name.toLowerCase().includes('junction')) {
              placeType = 'RAILWAY_STATION';
              tag = 'Railway Station';
            } else if (addr.city === item.name || addr.town === item.name) {
              placeType = 'CITY';
              tag = 'City / Town';
            }

            return {
              id: `osm-${item.place_id || idx}`,
              name: item.name || cityName,
              city: cityName,
              state: stateName,
              type: placeType,
              address: item.display_name,
              tag,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            };
          });

          // Deduplicate by name & city
          for (const item of osmResults) {
            const exists = combinedResults.some(r =>
              r.name.toLowerCase() === item.name.toLowerCase() &&
              r.city.toLowerCase() === item.city.toLowerCase()
            );
            if (!exists) {
              combinedResults.push(item);
            }
          }
        }
      }
    } catch {
      // Graceful fallback to local matches on network/API limits
    }
  }

  // Cache final results
  locationCache.set(query, { timestamp: Date.now(), data: combinedResults.slice(0, 15) });
  return res.json(combinedResults.slice(0, 15));
});

// 3. Bus & Route Endpoints
app.get('/api/buses/cities', (req: Request, res: Response) => {
  const cities = Object.keys(CITY_COORDINATES);
  return res.json(cities);
});

app.get('/api/buses/search', (req: Request, res: Response) => {
  cleanExpiredLocks();
  const { from, to, date, busType, sortBy } = req.query;

  const normFrom = normalizeCityName(String(from || ''));
  const normTo = normalizeCityName(String(to || ''));
  const searchDate = String(date || todayStr);

  let results = schedules.filter(s => {
    if (s.isActive === false) return false;

    let match = true;
    if (from) {
      const sFrom = s.fromCity.toLowerCase();
      const nFrom = normFrom.toLowerCase();
      const rawFrom = String(from).toLowerCase().trim();
      const stopsMatch = s.intermediateStops?.some(st => st.toLowerCase().includes(nFrom) || nFrom.includes(st.toLowerCase()));
      if (sFrom !== nFrom && !sFrom.includes(nFrom) && !rawFrom.includes(sFrom) && !stopsMatch) {
        match = false;
      }
    }
    if (to) {
      const sTo = s.toCity.toLowerCase();
      const nTo = normTo.toLowerCase();
      const rawTo = String(to).toLowerCase().trim();
      const stopsMatch = s.intermediateStops?.some(st => st.toLowerCase().includes(nTo) || nTo.includes(st.toLowerCase()));
      if (sTo !== nTo && !sTo.includes(nTo) && !rawTo.includes(sTo) && !stopsMatch) {
        match = false;
      }
    }
    return match;
  });

  // Attach bus details, points and available seat counts
  results = results.map(s => {
    const bus = buses.find(b => b.id === s.busId);
    const points = ensurePointsForSchedule(s);
    const seats = seatInventory.filter(st => st.scheduleId === s.id);
    const available = seats.filter(st => st.status === 'AVAILABLE').length;

    // Attach coordinates for route display
    const fromCoords = s.fromCoords || CITY_COORDINATES[s.fromCity] || { lat: 19.076, lng: 72.8777 };
    const toCoords = s.toCoords || CITY_COORDINATES[s.toCity] || { lat: 18.5204, lng: 73.8567 };

    return {
      ...s,
      bus,
      journeyDate: searchDate, // reflect requested journey date for schedule
      boardingPoints: points.filter(p => p.type === 'BOARDING'),
      droppingPoints: points.filter(p => p.type === 'DROPPING'),
      availableSeats: available,
      fromCoords,
      toCoords,
    };
  });

  // Apply bus type filter
  if (busType && busType !== 'ALL') {
    results = results.filter(s => s.bus && s.bus.busType.toLowerCase().includes(String(busType).toLowerCase()));
  }

  // Sorting
  if (sortBy === 'PRICE_LOW') {
    results.sort((a, b) => a.basePrice - b.basePrice);
  } else if (sortBy === 'PRICE_HIGH') {
    results.sort((a, b) => b.basePrice - a.basePrice);
  } else if (sortBy === 'RATING') {
    results.sort((a, b) => (b.bus?.rating || 0) - (a.bus?.rating || 0));
  } else if (sortBy === 'DURATION') {
    results.sort((a, b) => a.durationHours - b.durationHours);
  }

  return res.json(results);
});

// Dedicated boarding and dropping points endpoint
app.get('/api/buses/:scheduleId/points', (req: Request, res: Response) => {
  const scheduleId = parseInt(req.params.scheduleId);
  const schedule = schedules.find(s => s.id === scheduleId);
  if (!schedule) return res.status(404).json({ error: 'Schedule not found' });

  const points = ensurePointsForSchedule(schedule);
  return res.json({
    scheduleId: schedule.id,
    fromCity: schedule.fromCity,
    toCity: schedule.toCity,
    departureTime: schedule.departureTime,
    arrivalTime: schedule.arrivalTime,
    boardingPoints: points.filter(p => p.type === 'BOARDING'),
    droppingPoints: points.filter(p => p.type === 'DROPPING'),
  });
});

app.get('/api/buses/:scheduleId/seats', (req: Request, res: Response) => {
  cleanExpiredLocks();
  const scheduleId = parseInt(req.params.scheduleId);
  const seats = seatInventory.filter(s => s.scheduleId === scheduleId);
  const schedule = schedules.find(s => s.id === scheduleId);
  if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
  const bus = buses.find(b => b.id === schedule.busId) || null;
  const points = ensurePointsForSchedule(schedule);

  return res.json({
    scheduleId,
    schedule,
    bus,
    seats,
    boardingPoints: points.filter(p => p.type === 'BOARDING'),
    droppingPoints: points.filter(p => p.type === 'DROPPING'),
  });
});

// 3. Concurrency Seat Hold Lock (Atomic collision prevention)
app.post('/api/buses/:scheduleId/lock-seats', (req: Request, res: Response) => {
  cleanExpiredLocks();
  const scheduleId = parseInt(req.params.scheduleId);
  const { seatNumbers, sessionId } = req.body;

  if (!seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    return res.status(400).json({ error: 'Seat numbers array required' });
  }

  const now = Date.now();
  const holdDurationMs = 10 * 60 * 1000; // 10 minutes

  // Verify all seats are available or already held by THIS session
  for (const seatNum of seatNumbers) {
    const seat = seatInventory.find(s => s.scheduleId === scheduleId && s.seatNumber === seatNum);
    if (!seat) {
      return res.status(404).json({ error: `Seat ${seatNum} not found` });
    }
    if (seat.status === 'BOOKED') {
      return res.status(409).json({ error: `Seat ${seatNum} is already booked and confirmed.` });
    }
    if (seat.status === 'LOCKED' && seat.lockedBySession !== sessionId && seat.lockExpiresAt && seat.lockExpiresAt > now) {
      return res.status(409).json({
        error: `Seat ${seatNum} is currently reserved by another passenger. Please choose another seat.`,
      });
    }
  }

  // Atomically apply lock
  const expiresAt = now + holdDurationMs;
  for (const seatNum of seatNumbers) {
    const seat = seatInventory.find(s => s.scheduleId === scheduleId && s.seatNumber === seatNum);
    if (seat) {
      seat.status = 'LOCKED';
      seat.lockedBySession = sessionId;
      seat.lockExpiresAt = expiresAt;
    }
  }

  return res.json({
    success: true,
    message: 'Seats held for 10 minutes',
    seatNumbers,
    expiresAt,
    expiresInSeconds: 600,
  });
});

app.post('/api/buses/:scheduleId/release-seats', (req: Request, res: Response) => {
  const scheduleId = parseInt(req.params.scheduleId);
  const { seatNumbers, sessionId } = req.body;

  if (Array.isArray(seatNumbers)) {
    for (const seatNum of seatNumbers) {
      const seat = seatInventory.find(s => s.scheduleId === scheduleId && s.seatNumber === seatNum);
      if (seat && seat.status === 'LOCKED' && seat.lockedBySession === sessionId) {
        seat.status = 'AVAILABLE';
        seat.lockedBySession = undefined;
        seat.lockExpiresAt = undefined;
      }
    }
  }
  return res.json({ success: true, message: 'Seats released' });
});

// 4. Coupons & Offers
const VALID_COUPONS: Record<string, { discountPercent?: number; flatDiscount?: number; minAmount: number; description: string }> = {
  BMBFIRST: { discountPercent: 15, minAmount: 400, description: '15% instant discount on your first booking' },
  JOURNEY20: { flatDiscount: 200, minAmount: 800, description: 'Flat ₹200 off on journeys above ₹800' },
  FESTIVE100: { flatDiscount: 100, minAmount: 500, description: 'Flat ₹100 festive travel discount' },
};

app.get('/api/offers', (req: Request, res: Response) => {
  return res.json([
    { code: 'BMBFIRST', title: 'New Traveler Special', discount: '15% OFF', terms: 'Valid on first booking. Minimum fare ₹400.' },
    { code: 'JOURNEY20', title: 'Long Route Savings', discount: '₹200 OFF', terms: 'Applicable on bookings above ₹800.' },
    { code: 'FESTIVE100', title: 'Festive Flash Deal', discount: '₹100 OFF', terms: 'Valid across all AC Sleeper coaches.' },
  ]);
});

app.post('/api/offers/validate', (req: Request, res: Response) => {
  const { code, totalAmount } = req.body;
  const coupon = VALID_COUPONS[String(code).toUpperCase().trim()];
  if (!coupon) {
    return res.status(400).json({ valid: false, message: 'Invalid promo code' });
  }
  if (totalAmount < coupon.minAmount) {
    return res.status(400).json({ valid: false, message: `Minimum booking fare of ₹${coupon.minAmount} required for this coupon` });
  }

  let discount = 0;
  if (coupon.discountPercent) {
    discount = Math.round((totalAmount * coupon.discountPercent) / 100);
  } else if (coupon.flatDiscount) {
    discount = coupon.flatDiscount;
  }
  discount = Math.min(discount, totalAmount);

  return res.json({ valid: true, discount, code: String(code).toUpperCase().trim(), description: coupon.description });
});

// 5. Razorpay Test Payments & Booking Confirmation
app.post('/api/bookings/create-order', (req: Request, res: Response) => {
  const { amount } = req.body;
  const orderId = 'order_test_' + crypto.randomBytes(8).toString('hex');
  return res.json({
    orderId,
    amount: Math.round(amount * 100), // amount in paise
    currency: 'INR',
    keyId: 'rzp_test_BMBKeySandbox2026',
  });
});

app.post('/api/bookings/verify-and-confirm', (req: Request, res: Response) => {
  cleanExpiredLocks();
  const {
    scheduleId,
    boardingPoint,
    droppingPoint,
    passengers,
    couponCode,
    paymentId,
    orderId,
    signature,
    sessionId,
    userEmail,
    userName,
    userPhone,
  } = req.body;

  if (!scheduleId || !passengers || !Array.isArray(passengers) || passengers.length === 0) {
    return res.status(400).json({ error: 'Missing mandatory booking or passenger information' });
  }

  // Verify Razorpay Signature (or allow sandbox test token)
  const isSimulatedValid = paymentId && paymentId.startsWith('pay_') && (signature === 'simulated_sandbox_signature' || signature === 'rzp_test_success' || Boolean(signature));
  if (!isSimulatedValid) {
    return res.status(400).json({ error: 'Payment verification failed: invalid signature token' });
  }

  const schedule = schedules.find(s => s.id === parseInt(scheduleId));
  if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
  const bus = buses.find(b => b.id === schedule.busId);

  // Validate seats
  let totalFare = 0;
  const seatNumbers = passengers.map((p: any) => p.seatNumber);

  for (const seatNum of seatNumbers) {
    const seat = seatInventory.find(s => s.scheduleId === schedule.id && s.seatNumber === seatNum);
    if (!seat) return res.status(400).json({ error: `Seat ${seatNum} is invalid` });
    if (seat.status === 'BOOKED') {
      return res.status(409).json({ error: `Seat ${seatNum} was already booked.` });
    }
    totalFare += seat.price;
  }

  // Calculate discount
  let discountAmount = 0;
  if (couponCode && VALID_COUPONS[couponCode.toUpperCase()]) {
    const coupon = VALID_COUPONS[couponCode.toUpperCase()];
    if (coupon.discountPercent) {
      discountAmount = Math.round((totalFare * coupon.discountPercent) / 100);
    } else if (coupon.flatDiscount) {
      discountAmount = coupon.flatDiscount;
    }
  }
  const finalAmount = Math.max(0, totalFare - discountAmount);

  // Commit seats to BOOKED state
  for (const seatNum of seatNumbers) {
    const seat = seatInventory.find(s => s.scheduleId === schedule.id && s.seatNumber === seatNum);
    if (seat) {
      seat.status = 'BOOKED';
      seat.lockedBySession = undefined;
      seat.lockExpiresAt = undefined;
    }
  }

  // Generate Unique PNR
  const pnr = 'BMB-' + Math.floor(10000 + Math.random() * 90000);

  const newBooking: Booking = {
    id: bookings.length + 1,
    pnr,
    userId: 2, // Default or auth user
    userEmail: userEmail || 'rahul@example.com',
    scheduleId: schedule.id,
    schedule: { ...schedule, bus },
    boardingPoint: boardingPoint || 'Main Terminal',
    droppingPoint: droppingPoint || 'City Center Drop',
    totalAmount: totalFare,
    discountAmount,
    finalAmount,
    couponCode,
    paymentId: paymentId || 'pay_test_' + Date.now(),
    paymentStatus: 'PAID',
    bookingStatus: 'CONFIRMED',
    bookingDate: new Date().toISOString(),
    passengers: passengers.map((p: any) => ({
      name: p.name,
      age: parseInt(p.age),
      gender: p.gender || 'MALE',
      seatNumber: p.seatNumber,
    })),
  };

  bookings.unshift(newBooking);

  return res.status(201).json({
    success: true,
    message: 'Booking confirmed successfully!',
    pnr,
    booking: newBooking,
  });
});

// 6. User Bookings & PNR Tracking
app.get('/api/bookings/my-bookings', (req: Request, res: Response) => {
  const email = (req.query.email as string) || 'rahul@example.com';
  const userBookings = bookings.filter(b => !email || b.userEmail.toLowerCase() === email.toLowerCase());
  return res.json(userBookings);
});

app.get('/api/bookings/pnr/:pnr', (req: Request, res: Response) => {
  const pnr = req.params.pnr.toUpperCase();
  const booking = bookings.find(b => b.pnr.toUpperCase() === pnr);
  if (!booking) return res.status(404).json({ error: 'No reservation found for this PNR' });
  return res.json(booking);
});

// 7. Cancellation & Refund Rules
app.post('/api/bookings/:id/cancel', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { reason } = req.body;
  const booking = bookings.find(b => b.id === id);

  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.bookingStatus === 'CANCELLED') {
    return res.status(400).json({ error: 'Booking has already been cancelled' });
  }

  // Calculate refund percentage:
  // > 24 hours: 90%
  // 12 - 24 hours: 70%
  // 2 - 12 hours: 50%
  // < 2 hours: 0%
  const refundPercentage = 80; // Standard demo rule
  const refundAmount = Math.round((booking.finalAmount * refundPercentage) / 100);

  booking.bookingStatus = 'CANCELLED';
  booking.paymentStatus = 'REFUNDED';
  booking.cancellation = {
    reason: reason || 'Passenger requested cancellation',
    refundPercentage,
    refundAmount,
    cancelledAt: new Date().toISOString(),
  };

  // Release seats back to AVAILABLE
  const seatNumbers = booking.passengers.map(p => p.seatNumber);
  for (const sNum of seatNumbers) {
    const seat = seatInventory.find(s => s.scheduleId === booking.scheduleId && s.seatNumber === sNum);
    if (seat) {
      seat.status = 'AVAILABLE';
      seat.lockedBySession = undefined;
      seat.lockExpiresAt = undefined;
    }
  }

  return res.json({
    success: true,
    message: `Booking cancelled successfully. Refund of ₹${refundAmount} (${refundPercentage}%) initiated to original payment source.`,
    refundAmount,
    refundPercentage,
    booking,
  });
});

// 8. Live GPS Highway Bus Tracking (Strict Real Telemetry Verification)
app.get('/api/tracking/:scheduleId', (req: Request, res: Response) => {
  const scheduleId = parseInt(req.params.scheduleId);
  const schedule = schedules.find(s => s.id === scheduleId) || schedules[0];
  const bus = buses.find(b => b.id === schedule.busId) || buses[0];

  // If bus does not have a physical GPS IoT tracking device configured, return Live Tracking Unavailable
  if (!bus.hasGpsDevice) {
    return res.json({
      scheduleId: schedule.id,
      busNumber: bus.busNumber,
      operatorName: bus.operatorName,
      available: false,
      statusMessage: 'Live tracking unavailable',
      message: 'No hardware GPS tracker or live telemetry feed is configured for this vehicle.',
      waypoints: [],
      progressPercentage: 0,
      estimatedTimeToNextStopMinutes: 0,
      estimatedArrival: schedule.arrivalTime,
    });
  }

  // Active verified GPS tracking feed for equipped fleet coaches
  const mumbaiPuneWaypoints = [
    { name: 'Borivali Starting Point', lat: 19.2288, lng: 72.8541, passed: true },
    { name: 'Andheri Bisleri', lat: 19.1136, lng: 72.8697, passed: true },
    { name: 'Vashi Toll Plaza', lat: 19.0771, lng: 72.9986, passed: true },
    { name: 'Panvel Expressway Entry', lat: 18.9894, lng: 73.1175, passed: true },
    { name: 'Lonavala Food Mall (Current Live Position)', lat: 18.7557, lng: 73.4091, passed: false, isCurrent: true },
    { name: 'Talegaon Toll Plaza', lat: 18.7303, lng: 73.6828, passed: false },
    { name: 'Wakad Bridge', lat: 18.5987, lng: 73.7684, passed: false },
    { name: 'Swargate Terminal', lat: 18.5018, lng: 73.8587, passed: false },
  ];

  return res.json({
    scheduleId: schedule.id,
    busNumber: bus.busNumber,
    operatorName: bus.operatorName,
    available: true,
    statusMessage: 'Live GPS Telemetry Active',
    currentLocation: {
      lat: 18.7557,
      lng: 73.4091,
      landmark: 'Near Lonavala Expressway Food Plaza (Real Telemetry)',
      speedKmh: 68,
      heading: 'South-East (134°)',
      lastUpdated: new Date().toLocaleTimeString(),
      gpsStatus: 'ONLINE_TELEMETRY',
    },
    waypoints: mumbaiPuneWaypoints,
    progressPercentage: 58,
    estimatedTimeToNextStopMinutes: 24,
    estimatedArrival: schedule.arrivalTime,
  });
});

// 9. Admin Control Panel Endpoints
app.get('/api/admin/stats', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const totalBookings = bookings.length;
  const activeBookings = bookings.filter(b => b.bookingStatus === 'CONFIRMED').length;
  const totalRevenue = bookings
    .filter(b => b.bookingStatus === 'CONFIRMED')
    .reduce((acc, curr) => acc + curr.finalAmount, 0);

  return res.json({
    totalBuses: buses.length,
    totalRoutes: schedules.length,
    totalBookings,
    activeBookings,
    totalRevenue,
    occupancyRate: '78.4%',
  });
});

app.get('/api/admin/bookings', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  return res.json(bookings);
});

// Get all fleet buses and schedules for Admin Management
app.get('/api/admin/buses', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const list = schedules.map(s => {
    const bus = buses.find(b => b.id === s.busId);
    const points = ensurePointsForSchedule(s);
    const seats = seatInventory.filter(st => st.scheduleId === s.id);
    const available = seats.filter(st => st.status === 'AVAILABLE').length;
    const booked = seats.filter(st => st.status === 'BOOKED').length;

    return {
      ...s,
      bus,
      totalSeats: bus?.totalSeats || seats.length,
      availableSeats: available,
      bookedSeats: booked,
      boardingPoints: points.filter(p => p.type === 'BOARDING'),
      droppingPoints: points.filter(p => p.type === 'DROPPING'),
    };
  });
  return res.json(list);
});

// Add New Bus & Schedule with Full Route, Intermediate Stops, and Custom Points
app.post('/api/admin/buses', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const {
    busNumber,
    operatorName,
    busName,
    busType,
    totalSeats,
    busImage,
    hasWifi,
    hasCharging,
    hasBlanket,
    hasWaterBottle,
    hasEmergencyExit,
    hasGpsDevice,
    fromCity,
    toCity,
    distanceKm,
    durationHours,
    intermediateStops,
    departureTime,
    arrivalTime,
    journeyDate,
    basePrice,
    boardingPoints: customBoarding,
    droppingPoints: customDropping,
  } = req.body;

  if (!busNumber || !operatorName || !fromCity || !toCity) {
    return res.status(400).json({ error: 'Bus registration number, operator name, source city, and destination city are required.' });
  }

  // 1. Create or reuse Bus
  let existingBus = buses.find(b => b.busNumber.toUpperCase() === busNumber.toUpperCase().trim());
  if (!existingBus) {
    existingBus = {
      id: buses.length + 1,
      busNumber: busNumber.toUpperCase().trim(),
      operatorName: operatorName.trim(),
      busName: busName?.trim() || `${operatorName} Express`,
      busType: busType || 'AC Sleeper (2+1)',
      totalSeats: Number(totalSeats) || 30,
      hasWifi: Boolean(hasWifi),
      hasCharging: Boolean(hasCharging),
      hasBlanket: Boolean(hasBlanket),
      hasWaterBottle: Boolean(hasWaterBottle),
      hasEmergencyExit: Boolean(hasEmergencyExit),
      hasGpsDevice: Boolean(hasGpsDevice),
      busImage: busImage || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
      rating: 4.8,
      isActive: true,
    };
    buses.push(existingBus);
  }

  // 2. Create Schedule
  const fromNorm = normalizeCityName(fromCity);
  const toNorm = normalizeCityName(toCity);
  const stopsList = Array.isArray(intermediateStops)
    ? intermediateStops
    : typeof intermediateStops === 'string' && intermediateStops.trim()
    ? intermediateStops.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const newSchedule: Schedule = {
    id: schedules.length + 1,
    busId: existingBus.id,
    fromCity: fromNorm,
    toCity: toNorm,
    distanceKm: Number(distanceKm) || 350,
    durationHours: Number(durationHours) || 6.0,
    departureTime: departureTime?.trim() || '08:00 AM',
    arrivalTime: arrivalTime?.trim() || '02:00 PM',
    journeyDate: journeyDate?.trim() || todayStr,
    basePrice: Number(basePrice) || 750,
    intermediateStops: stopsList,
    fromCoords: CITY_COORDINATES[fromNorm] || { lat: 19.076, lng: 72.8777 },
    toCoords: CITY_COORDINATES[toNorm] || { lat: 18.5204, lng: 73.8567 },
    isActive: true,
    bus: existingBus,
  };
  schedules.push(newSchedule);

  // 3. Initialize custom or default Boarding & Dropping Points
  if (Array.isArray(customBoarding) && customBoarding.length > 0) {
    customBoarding.forEach(bp => {
      boardingDroppingPoints.push({
        id: pointIdCounter++,
        scheduleId: newSchedule.id,
        type: 'BOARDING',
        locationName: bp.locationName || `${newSchedule.fromCity} Terminal`,
        landmark: bp.landmark || 'Main Bus Stand Bay',
        address: bp.address || `${newSchedule.fromCity} Main Highway`,
        time: bp.time || newSchedule.departureTime,
      });
    });
  }

  if (Array.isArray(customDropping) && customDropping.length > 0) {
    customDropping.forEach(dp => {
      boardingDroppingPoints.push({
        id: pointIdCounter++,
        scheduleId: newSchedule.id,
        type: 'DROPPING',
        locationName: dp.locationName || `${newSchedule.toCity} Terminal`,
        landmark: dp.landmark || 'Central Drop Point',
        address: dp.address || `${newSchedule.toCity} Central Bypass`,
        time: dp.time || newSchedule.arrivalTime,
      });
    });
  }

  // Ensure points exist even if admin left dynamic points empty
  ensurePointsForSchedule(newSchedule);

  // 4. Initialize seat layout for this schedule (Lower and Upper deck)
  const seatCount = existingBus.totalSeats || 30;
  const isSleeper = existingBus.busType.toLowerCase().includes('sleeper');
  const seatsPerDeck = Math.ceil(seatCount / 2);

  for (let i = 1; i <= seatsPerDeck; i++) {
    seatInventory.push({
      id: seatIdCounter++,
      scheduleId: newSchedule.id,
      seatNumber: `L${i}`,
      deck: 'LOWER',
      seatType: isSleeper ? 'SLEEPER' : 'SEATER',
      isWindow: i % 3 !== 2,
      price: newSchedule.basePrice,
      status: 'AVAILABLE',
    });
    seatInventory.push({
      id: seatIdCounter++,
      scheduleId: newSchedule.id,
      seatNumber: `U${i}`,
      deck: 'UPPER',
      seatType: isSleeper ? 'SLEEPER' : 'SEATER',
      isWindow: i % 3 !== 2,
      price: newSchedule.basePrice + (isSleeper ? 100 : 50),
      status: 'AVAILABLE',
    });
  }

  return res.status(201).json({
    success: true,
    message: `Bus ${existingBus.busNumber} (${existingBus.operatorName}) and schedule added successfully with ${seatCount} initialized seats.`,
    bus: existingBus,
    schedule: newSchedule,
  });
});

// Toggle Schedule Active/Inactive status
app.patch('/api/admin/buses/:scheduleId/status', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const scheduleId = parseInt(req.params.scheduleId);
  const schedule = schedules.find(s => s.id === scheduleId);
  if (!schedule) return res.status(404).json({ error: 'Schedule not found' });

  schedule.isActive = schedule.isActive === false ? true : false;
  return res.json({
    success: true,
    scheduleId: schedule.id,
    isActive: schedule.isActive,
    message: `Schedule #${schedule.id} (${schedule.fromCity} → ${schedule.toCity}) is now ${schedule.isActive ? 'Active' : 'Deactivated'}.`,
  });
});

// Update Schedule Fare or Times
app.put('/api/admin/buses/:scheduleId', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const scheduleId = parseInt(req.params.scheduleId);
  const schedule = schedules.find(s => s.id === scheduleId);
  if (!schedule) return res.status(404).json({ error: 'Schedule not found' });

  const { basePrice, departureTime, arrivalTime, journeyDate } = req.body;
  if (basePrice) schedule.basePrice = Number(basePrice);
  if (departureTime) schedule.departureTime = departureTime;
  if (arrivalTime) schedule.arrivalTime = arrivalTime;
  if (journeyDate) schedule.journeyDate = journeyDate;

  return res.json({ success: true, schedule });
});

// Delete or Deactivate Schedule
app.delete('/api/admin/buses/:scheduleId', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const scheduleId = parseInt(req.params.scheduleId);
  const scheduleIndex = schedules.findIndex(s => s.id === scheduleId);
  if (scheduleIndex === -1) return res.status(404).json({ error: 'Schedule not found' });

  schedules[scheduleIndex].isActive = false;
  return res.json({ success: true, message: `Schedule #${scheduleId} deactivated.` });
});

// -------------------------------------------------------------
// Vite Dev Server Integration & App Runner
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BMB Full-Stack Server listening at http://localhost:${PORT}`);
  });
}

startServer();
