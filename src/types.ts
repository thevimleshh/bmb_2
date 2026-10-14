export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'ROLE_USER' | 'ROLE_ADMIN';
}

export interface Bus {
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

export interface BoardingPoint {
  id: number;
  scheduleId: number;
  type: 'BOARDING' | 'DROPPING';
  locationName: string;
  landmark: string;
  address?: string;
  time: string;
}

export interface Schedule {
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

export interface SeatItem {
  id: number;
  scheduleId: number;
  seatNumber: string;
  deck: 'LOWER' | 'UPPER';
  seatType: 'SEATER' | 'SLEEPER';
  isWindow: boolean;
  price: number;
  status: 'AVAILABLE' | 'LOCKED' | 'BOOKED';
  lockedBySession?: string;
  lockExpiresAt?: number;
}

export interface Passenger {
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  seatNumber: string;
}

export interface Booking {
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

export interface Waypoint {
  name: string;
  lat: number;
  lng: number;
  passed: boolean;
  isCurrent?: boolean;
}

export interface TrackingData {
  scheduleId: number;
  busNumber: string;
  operatorName: string;
  currentLocation: {
    lat: number;
    lng: number;
    landmark: string;
    speedKmh: number;
    heading: string;
    lastUpdated: string;
    gpsStatus: string;
  };
  waypoints: Waypoint[];
  progressPercentage: number;
  estimatedTimeToNextStopMinutes: number;
  estimatedArrival: string;
}

export interface Offer {
  code: string;
  title: string;
  discount: string;
  terms: string;
}
