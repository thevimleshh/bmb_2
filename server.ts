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
  busType: string;
  totalSeats: number;
  hasWifi: boolean;
  hasCharging: boolean;
  hasBlanket: boolean;
  hasWaterBottle: boolean;
  hasEmergencyExit: boolean;
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
    busType: 'AC Sleeper (2+1)',
    totalSeats: 30,
    hasWifi: true,
    hasCharging: true,
    hasBlanket: true,
    hasWaterBottle: true,
    hasEmergencyExit: true,
    rating: 4.8,
    isActive: true,
  },
  {
    id: 2,
    busNumber: 'KA-01-AB-1244',
    operatorName: 'IntrCity SmartBus',
    busType: 'Volvo Multi-Axle AC Sleeper',
    totalSeats: 30,
    hasWifi: true,
    hasCharging: true,
    hasBlanket: true,
    hasWaterBottle: true,
    hasEmergencyExit: true,
    rating: 4.9,
    isActive: true,
  },
  {
    id: 3,
    busNumber: 'DL-01-ZG-9001',
    operatorName: 'Zingbus Express',
    busType: 'AC Sleeper Premium',
    totalSeats: 30,
    hasWifi: true,
    hasCharging: true,
    hasBlanket: true,
    hasWaterBottle: true,
    hasEmergencyExit: true,
    rating: 4.7,
    isActive: true,
  },
  {
    id: 4,
    busNumber: 'TS-09-OR-4411',
    operatorName: 'Orange Tours and Travels',
    busType: 'AC Sleeper / Seater (2+1)',
    totalSeats: 30,
    hasWifi: true,
    hasCharging: true,
    hasBlanket: true,
    hasWaterBottle: true,
    hasEmergencyExit: true,
    rating: 4.6,
    isActive: true,
  },
  {
    id: 5,
    busNumber: 'TN-07-SR-7733',
    operatorName: 'SRS Travels',
    busType: 'BharatBenz AC Seater (2+2)',
    totalSeats: 36,
    hasWifi: false,
    hasCharging: true,
    hasBlanket: false,
    hasWaterBottle: true,
    hasEmergencyExit: true,
    rating: 4.4,
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

// 2. Bus & Route Endpoints
app.get('/api/buses/cities', (req: Request, res: Response) => {
  const cities = ['Mumbai', 'Pune', 'Bangalore', 'Chennai', 'Delhi', 'Jaipur', 'Hyderabad', 'Goa', 'Ahmedabad', 'Surat'];
  return res.json(cities);
});

app.get('/api/buses/search', (req: Request, res: Response) => {
  cleanExpiredLocks();
  const { from, to, date, busType, sortBy } = req.query;

  let results = schedules.filter(s => {
    let match = true;
    if (from && s.fromCity.toLowerCase() !== String(from).toLowerCase().trim()) match = false;
    if (to && s.toCity.toLowerCase() !== String(to).toLowerCase().trim()) match = false;
    return match;
  });

  // Attach bus details, points and available seat counts
  results = results.map(s => {
    const bus = buses.find(b => b.id === s.busId);
    const points = ensurePointsForSchedule(s);
    const seats = seatInventory.filter(st => st.scheduleId === s.id);
    const available = seats.filter(st => st.status === 'AVAILABLE').length;

    return {
      ...s,
      bus,
      boardingPoints: points.filter(p => p.type === 'BOARDING'),
      droppingPoints: points.filter(p => p.type === 'DROPPING'),
      availableSeats: available,
    };
  });

  // Apply filters
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

// 8. Live GPS Highway Bus Tracking
app.get('/api/tracking/:scheduleId', (req: Request, res: Response) => {
  const scheduleId = parseInt(req.params.scheduleId);
  const schedule = schedules.find(s => s.id === scheduleId) || schedules[0];
  const bus = buses.find(b => b.id === schedule.busId) || buses[0];

  // Route waypoints (e.g., Mumbai to Pune Expressway corridor)
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
    currentLocation: {
      lat: 18.7557,
      lng: 73.4091,
      landmark: 'Near Lonavala Expressway Food Plaza',
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

app.post('/api/admin/buses', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const { busNumber, operatorName, busType, totalSeats, basePrice, fromCity, toCity, departureTime, arrivalTime } = req.body;
  if (!busNumber || !operatorName || !fromCity || !toCity) {
    return res.status(400).json({ error: 'Bus details, route and cities are required' });
  }

  const newBus: Bus = {
    id: buses.length + 1,
    busNumber,
    operatorName,
    busType: busType || 'AC Sleeper (2+1)',
    totalSeats: totalSeats || 30,
    hasWifi: true,
    hasCharging: true,
    hasBlanket: true,
    hasWaterBottle: true,
    hasEmergencyExit: true,
    rating: 4.8,
    isActive: true,
  };
  buses.push(newBus);

  const newSchedule: Schedule = {
    id: schedules.length + 1,
    busId: newBus.id,
    fromCity,
    toCity,
    distanceKm: 200,
    durationHours: 4.0,
    departureTime: departureTime || '08:00 AM',
    arrivalTime: arrivalTime || '12:00 PM',
    journeyDate: todayStr,
    basePrice: Number(basePrice) || 600,
    bus: newBus,
  };
  schedules.push(newSchedule);

  // Initialize seats for this bus
  for (let i = 1; i <= (newBus.totalSeats / 2); i++) {
    seatInventory.push({
      id: seatIdCounter++,
      scheduleId: newSchedule.id,
      seatNumber: `L${i}`,
      deck: 'LOWER',
      seatType: 'SLEEPER',
      isWindow: i % 3 !== 2,
      price: newSchedule.basePrice,
      status: 'AVAILABLE',
    });
    seatInventory.push({
      id: seatIdCounter++,
      scheduleId: newSchedule.id,
      seatNumber: `U${i}`,
      deck: 'UPPER',
      seatType: 'SLEEPER',
      isWindow: i % 3 !== 2,
      price: newSchedule.basePrice + 100,
      status: 'AVAILABLE',
    });
  }

  // Initialize boarding and dropping points for this new bus schedule
  ensurePointsForSchedule(newSchedule);

  return res.status(201).json({ success: true, bus: newBus, schedule: newSchedule });
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
