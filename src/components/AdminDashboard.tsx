import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Booking } from '../types';
import {
  Shield,
  Bus as BusIcon,
  TrendingUp,
  Users,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Power,
  Search,
  MapPin,
  Clock,
  Wifi,
  Zap,
  Navigation,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  Trash2,
  Plus,
} from 'lucide-react';

interface FleetScheduleItem {
  id: number;
  busId: number;
  fromCity: string;
  toCity: string;
  departureTime: string;
  arrivalTime: string;
  journeyDate: string;
  basePrice: number;
  distanceKm?: number;
  durationHours?: number;
  isActive?: boolean;
  totalSeats?: number;
  availableSeats?: number;
  bookedSeats?: number;
  intermediateStops?: string[];
  bus?: {
    id: number;
    busNumber: string;
    operatorName: string;
    busName?: string;
    busType: string;
    totalSeats: number;
    hasWifi?: boolean;
    hasCharging?: boolean;
    hasBlanket?: boolean;
    hasWaterBottle?: boolean;
    hasEmergencyExit?: boolean;
    hasGpsDevice?: boolean;
    busImage?: string;
    rating?: number;
    isActive?: boolean;
  };
}

interface CustomPoint {
  locationName: string;
  landmark: string;
  address: string;
  time: string;
}

export const AdminDashboard: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'MANIFEST' | 'FLEET' | 'ADDBUS'>('FLEET');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [fleetSchedules, setFleetSchedules] = useState<FleetScheduleItem[]>([]);
  const [fleetSearchQuery, setFleetSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalBuses: 7,
    totalRoutes: 11,
    totalBookings: 1,
    activeBookings: 1,
    totalRevenue: 1000,
    occupancyRate: '78.4%',
  });
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // --- Add Bus Form State ---
  // Bus Information
  const [operatorName, setOperatorName] = useState('');
  const [busName, setBusName] = useState('');
  const [busNumber, setBusNumber] = useState('');
  const [isAc, setIsAc] = useState(true);
  const [seatConfig, setSeatConfig] = useState<'SLEEPER' | 'SEATER' | 'VOLVO'>('SLEEPER');
  const [totalSeats, setTotalSeats] = useState(30);
  const [busImage, setBusImage] = useState('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80');
  const [hasWifi, setHasWifi] = useState(true);
  const [hasCharging, setHasCharging] = useState(true);
  const [hasBlanket, setHasBlanket] = useState(true);
  const [hasWaterBottle, setHasWaterBottle] = useState(true);
  const [hasGpsDevice, setHasGpsDevice] = useState(true);
  const [hasEmergencyExit, setHasEmergencyExit] = useState(true);

  // Route Information
  const [fromCity, setFromCity] = useState('Mumbai');
  const [fromMainBoarding, setFromMainBoarding] = useState('Borivali West BMB Hub, WEH');
  const [toCity, setToCity] = useState('Bangalore');
  const [toMainDropping, setToMainDropping] = useState('Majestic Central Bus Stand Exit Gate 2');
  const [intermediateStops, setIntermediateStops] = useState('Pune, Kolhapur, Belgaum, Hubli, Tumkur');
  const [distanceKm, setDistanceKm] = useState(985);
  const [durationHours, setDurationHours] = useState(15);

  // Custom Boarding and Dropping Points Lists
  const [boardingPointsList, setBoardingPointsList] = useState<CustomPoint[]>([
    { locationName: 'Borivali West', landmark: 'Near Gokul Hotel', address: 'Western Express Highway, Borivali West', time: '06:30 PM' },
    { locationName: 'Andheri East', landmark: 'Bisleri Flyover', address: 'WEH Metro Station Junction, Andheri East', time: '07:15 PM' },
    { locationName: 'Vashi Toll Plaza', landmark: 'Below Highway Bridge', address: 'Sector 17, Vashi, Navi Mumbai', time: '08:00 PM' },
  ]);

  const [droppingPointsList, setDroppingPointsList] = useState<CustomPoint[]>([
    { locationName: 'Majestic Metro Station', landmark: 'Terminal Exit Gate 2', address: 'Subhash Nagar, Central Bus Stand', time: '08:30 AM' },
    { locationName: 'Electronic City Toll', landmark: 'Elevated Highway Ramp', address: 'Hosur Main Road, Phase 1', time: '09:30 AM' },
  ]);

  // Schedule Information
  const todayIso = new Date().toISOString().split('T')[0];
  const [journeyDate, setJourneyDate] = useState(todayIso);
  const [departureTime, setDepartureTime] = useState('06:30 PM');
  const [arrivalTime, setArrivalTime] = useState('09:30 AM');
  const [basePrice, setBasePrice] = useState(1499);
  const [isActiveStatus, setIsActiveStatus] = useState(true);

  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAdminData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [statsRes, bookingsRes, busesRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/bookings', { headers }),
        fetch('/api/admin/buses', { headers }),
      ]);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData);
      }
      if (busesRes.ok) {
        const busesData = await busesRes.json();
        setFleetSchedules(busesData);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  // Toggle Schedule Active/Inactive status
  const handleToggleStatus = async (scheduleId: number) => {
    setActionLoadingId(scheduleId);
    try {
      const res = await fetch(`/api/admin/buses/${scheduleId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setFleetSchedules(prev =>
          prev.map(s => (s.id === scheduleId ? { ...s, isActive: data.isActive } : s))
        );
      }
    } catch {
      // ignore
    } finally {
      setActionLoadingId(null);
    }
  };

  // Pre-fill form to add another date for an existing bus
  const handleQuickAddDate = (item: FleetScheduleItem) => {
    if (item.bus) {
      setOperatorName(item.bus.operatorName);
      setBusName(item.bus.busName || `${item.bus.operatorName} Express`);
      setBusNumber(item.bus.busNumber);
      setTotalSeats(item.bus.totalSeats);
      setHasWifi(item.bus.hasWifi ?? true);
      setHasCharging(item.bus.hasCharging ?? true);
      setHasBlanket(item.bus.hasBlanket ?? true);
      setHasWaterBottle(item.bus.hasWaterBottle ?? true);
      setHasGpsDevice(item.bus.hasGpsDevice ?? true);
      setHasEmergencyExit(item.bus.hasEmergencyExit ?? true);
      if (item.bus.busImage) setBusImage(item.bus.busImage);
    }
    setFromCity(item.fromCity);
    setToCity(item.toCity);
    setDepartureTime(item.departureTime);
    setArrivalTime(item.arrivalTime);
    setBasePrice(item.basePrice);
    if (item.distanceKm) setDistanceKm(item.distanceKm);
    if (item.durationHours) setDurationHours(item.durationHours);
    if (item.intermediateStops) setIntermediateStops(item.intermediateStops.join(', '));
    // Set journey date to tomorrow
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setJourneyDate(d.toISOString().split('T')[0]);

    setActiveTab('ADDBUS');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add Boarding Point row
  const addBoardingPointRow = () => {
    setBoardingPointsList(prev => [
      ...prev,
      { locationName: '', landmark: '', address: '', time: departureTime },
    ]);
  };

  const removeBoardingPointRow = (idx: number) => {
    setBoardingPointsList(prev => prev.filter((_, i) => i !== idx));
  };

  const updateBoardingPoint = (idx: number, field: keyof CustomPoint, val: string) => {
    setBoardingPointsList(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  // Add Dropping Point row
  const addDroppingPointRow = () => {
    setDroppingPointsList(prev => [
      ...prev,
      { locationName: '', landmark: '', address: '', time: arrivalTime },
    ]);
  };

  const removeDroppingPointRow = (idx: number) => {
    setDroppingPointsList(prev => prev.filter((_, i) => i !== idx));
  };

  const updateDroppingPoint = (idx: number, field: keyof CustomPoint, val: string) => {
    setDroppingPointsList(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  // Compute computed busType string
  const resolvedBusType = isAc
    ? seatConfig === 'VOLVO'
      ? 'Volvo Multi-Axle AC Sleeper'
      : seatConfig === 'SLEEPER'
      ? 'AC Sleeper (2+1)'
      : 'BharatBenz AC Seater (2+2)'
    : seatConfig === 'SLEEPER'
    ? 'Non-AC Sleeper'
    : 'Non-AC Seater (2+2)';

  // Handle Form Submit
  const handleAddBus = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // Validation
    if (!busNumber.trim() || !operatorName.trim()) {
      setFormError('Please provide both Bus Registration Number and Fleet Operator Name.');
      return;
    }
    if (!fromCity.trim() || !toCity.trim()) {
      setFormError('Please specify starting origin city and destination city.');
      return;
    }
    if (fromCity.trim().toLowerCase() === toCity.trim().toLowerCase()) {
      setFormError('Origin and destination cities cannot be the same.');
      return;
    }
    if (!journeyDate) {
      setFormError('Please choose a valid Journey Date.');
      return;
    }
    if (basePrice < 100) {
      setFormError('Base ticket price must be at least ₹100.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        busNumber: busNumber.trim().toUpperCase(),
        operatorName: operatorName.trim(),
        busName: busName.trim() || `${operatorName.trim()} Luxury Class`,
        busType: resolvedBusType,
        totalSeats: Number(totalSeats) || 30,
        busImage: busImage.trim(),
        hasWifi,
        hasCharging,
        hasBlanket,
        hasWaterBottle,
        hasEmergencyExit,
        hasGpsDevice,
        fromCity: fromCity.trim(),
        toCity: toCity.trim(),
        distanceKm: Number(distanceKm) || 450,
        durationHours: Number(durationHours) || 8,
        intermediateStops: intermediateStops.split(',').map(s => s.trim()).filter(Boolean),
        departureTime: departureTime.trim(),
        arrivalTime: arrivalTime.trim(),
        journeyDate: journeyDate.trim(),
        basePrice: Number(basePrice),
        boardingPoints: boardingPointsList.filter(p => p.locationName.trim()),
        droppingPoints: droppingPointsList.filter(p => p.locationName.trim()),
        isActive: isActiveStatus,
      };

      const res = await fetch('/api/admin/buses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to add bus');
        setIsSubmitting(false);
        return;
      }

      setFormSuccess(
        `Bus ${busNumber.toUpperCase()} (${operatorName}) and schedule for ${fromCity} → ${toCity} on ${journeyDate} successfully registered with ${totalSeats} initialized seats!`
      );
      setIsSubmitting(false);
      fetchAdminData();
    } catch {
      setFormError('Network error while saving bus schedule to database.');
      setIsSubmitting(false);
    }
  };

  const filteredFleet = fleetSchedules.filter(s => {
    if (!fleetSearchQuery.trim()) return true;
    const q = fleetSearchQuery.toLowerCase();
    return (
      s.fromCity.toLowerCase().includes(q) ||
      s.toCity.toLowerCase().includes(q) ||
      (s.bus?.operatorName && s.bus.operatorName.toLowerCase().includes(q)) ||
      (s.bus?.busNumber && s.bus.busNumber.toLowerCase().includes(q)) ||
      s.journeyDate.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-orange-600" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Fleet Operations & Booking System
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage hundreds of coaches, configure multi-stop routes, boarding/dropping points, and journey schedules.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('FLEET')}
            className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'FLEET'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BusIcon className="w-3.5 h-3.5 text-orange-600" />
            <span>Fleet & Schedules ({fleetSchedules.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ADDBUS')}
            className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ADDBUS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-orange-600" />
            <span>Add Bus & Schedule</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MANIFEST')}
            className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'MANIFEST'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-orange-600" />
            <span>Bookings ({bookings.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Fleet Buses</div>
          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-1">
            {stats.totalBuses} Coaches
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{stats.totalRoutes} Active Schedules</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Bookings</div>
          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-1">
            {stats.totalBookings}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            {stats.activeBookings} Confirmed
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Ticket Revenue</div>
          <div className="text-2xl font-black text-emerald-600 font-mono tabular-nums mt-1">
            ₹{stats.totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Razorpay Test Mode</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Fleet Occupancy</div>
          <div className="text-2xl font-black text-orange-600 font-mono tabular-nums mt-1">
            {stats.occupancyRate}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across Intercity Network</div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: FLEET & SCHEDULES MANAGEMENT                      */}
      {/* ======================================================== */}
      {activeTab === 'FLEET' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                All Active & Scheduled Coaches ({filteredFleet.length})
              </h2>
              <p className="text-xs text-slate-500">
                Search, inspect route details, toggle active status, and add new dates for existing fleet buses.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={fleetSearchQuery}
                onChange={e => setFleetSearchQuery(e.target.value)}
                placeholder="Search operator, city, bus #..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 font-bold">
                <tr>
                  <th className="px-4 py-3">Bus / Coach</th>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Journey Date</th>
                  <th className="px-4 py-3">Timings</th>
                  <th className="px-4 py-3">Fare</th>
                  <th className="px-4 py-3">Seats</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFleet.map(s => {
                  const isActive = s.isActive !== false;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{s.bus?.operatorName || 'Operator'}</div>
                        <div className="text-[11px] font-mono text-slate-500">{s.bus?.busNumber}</div>
                        <div className="text-[10px] text-orange-600 font-medium">{s.bus?.busType}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <span>{s.fromCity}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span>{s.toCity}</span>
                        </div>
                        {s.intermediateStops && s.intermediateStops.length > 0 && (
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">
                            Via: {s.intermediateStops.join(', ')}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400">
                          {s.distanceKm ? `${s.distanceKm} km` : ''} {s.durationHours ? `(${s.durationHours} hrs)` : ''}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-mono font-semibold text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{s.journeyDate}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-mono text-[11px] font-bold text-slate-800">
                          {s.departureTime}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400">
                          Arr: {s.arrivalTime}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900 text-sm">
                        ₹{s.basePrice}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-mono font-bold text-emerald-600">
                          {s.availableSeats ?? 30} Available
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {s.bookedSeats ?? 0} booked / {s.totalSeats ?? 30} total
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(s.id)}
                          disabled={actionLoadingId === s.id}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
                            isActive
                              ? 'border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                              : 'border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                          title={isActive ? 'Deactivate this schedule' : 'Activate this schedule'}
                        >
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickAddDate(s)}
                          className="px-2.5 py-1 rounded text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors cursor-pointer"
                          title="Add another journey date for this coach and route"
                        >
                          + New Date
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: COMPREHENSIVE ADD BUS & SCHEDULE FORM             */}
      {/* ======================================================== */}
      {activeTab === 'ADDBUS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 max-w-4xl">
          <div className="border-b border-slate-200 pb-4 mb-6">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Add New Bus & Schedule to Database
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Store buses and individual journey schedules separately so that one bus can operate on many dates and routes. Automatically initializes seat inventory and booking concurrency locks.
            </p>
          </div>

          {formSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2.5 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-emerald-900">Success!</div>
                <div>{formSuccess}</div>
              </div>
            </div>
          )}

          {formError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5 font-medium">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-red-900">Validation Error</div>
                <div>{formError}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleAddBus} className="space-y-8 text-xs">
            
            {/* SECTION 1: BUS INFORMATION */}
            <div className="space-y-4 bg-slate-50/70 p-5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <BusIcon className="w-4 h-4 text-orange-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  1. Bus & Fleet Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bus Operator Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={operatorName}
                    onChange={e => setOperatorName(e.target.value)}
                    placeholder="e.g. VRL Travels, Zingbus, Orange"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bus Model / Commercial Name
                  </label>
                  <input
                    type="text"
                    value={busName}
                    onChange={e => setBusName(e.target.value)}
                    placeholder="e.g. Scania Metrolink Multi-Axle HD"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Registration / Fleet Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={busNumber}
                    onChange={e => setBusNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. MH-12-RN-8899"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Air Conditioning
                  </label>
                  <div className="flex items-center gap-4 py-2">
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="isAc"
                        checked={isAc}
                        onChange={() => setIsAc(true)}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <span>AC Coach</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="isAc"
                        checked={!isAc}
                        onChange={() => setIsAc(false)}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <span>Non-AC</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Seating Layout Type
                  </label>
                  <select
                    value={seatConfig}
                    onChange={e => setSeatConfig(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="SLEEPER">Sleeper (2+1)</option>
                    <option value="SEATER">Seater (2+2)</option>
                    <option value="VOLVO">Volvo Multi-Axle Sleeper</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Total Seats in Coach
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="60"
                    required
                    value={totalSeats}
                    onChange={e => setTotalSeats(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Coach Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={busImage}
                  onChange={e => setBusImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-2">
                  Amenities & Safety Devices Installed
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer bg-white p-2.5 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={hasWifi}
                      onChange={e => setHasWifi(e.target.checked)}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span>High-Speed Wi-Fi</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer bg-white p-2.5 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={hasCharging}
                      onChange={e => setHasCharging(e.target.checked)}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span>Charging Ports</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer bg-white p-2.5 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={hasBlanket}
                      onChange={e => setHasBlanket(e.target.checked)}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span>Fresh Blanket</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer bg-white p-2.5 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={hasWaterBottle}
                      onChange={e => setHasWaterBottle(e.target.checked)}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span>Water Bottle</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer bg-white p-2.5 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={hasGpsDevice}
                      onChange={e => setHasGpsDevice(e.target.checked)}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span>Hardware GPS IoT</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer bg-white p-2.5 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={hasEmergencyExit}
                      onChange={e => setHasEmergencyExit(e.target.checked)}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span>Emergency Exit</span>
                  </label>
                </div>
              </div>
            </div>

            {/* SECTION 2: ROUTE INFORMATION */}
            <div className="space-y-4 bg-slate-50/70 p-5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <MapPin className="w-4 h-4 text-orange-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  2. Route & Intermediate Stops
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Starting Origin City *
                  </label>
                  <input
                    type="text"
                    required
                    value={fromCity}
                    onChange={e => setFromCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Destination City *
                  </label>
                  <input
                    type="text"
                    required
                    value={toCity}
                    onChange={e => setToCity(e.target.value)}
                    placeholder="e.g. Bangalore"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estimated Route Distance (km)
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={distanceKm}
                    onChange={e => setDistanceKm(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estimated Journey Duration (Hours)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={durationHours}
                    onChange={e => setDurationHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Intermediate Stops (Comma separated)
                </label>
                <input
                  type="text"
                  value={intermediateStops}
                  onChange={e => setIntermediateStops(e.target.value)}
                  placeholder="e.g. Pune, Kolhapur, Belgaum, Hubli, Tumkur"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                />
              </div>

              {/* Dynamic Boarding Points Configurator */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                    Boarding Points & Pick-up Times (Origin)
                  </span>
                  <button
                    type="button"
                    onClick={addBoardingPointRow}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Boarding Stop
                  </button>
                </div>

                <div className="space-y-2">
                  {boardingPointsList.map((bp, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 bg-white p-2 rounded-lg border border-slate-200 items-center">
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={bp.locationName}
                          onChange={e => updateBoardingPoint(idx, 'locationName', e.target.value)}
                          placeholder="Stop Name (e.g. Borivali West)"
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={bp.landmark}
                          onChange={e => updateBoardingPoint(idx, 'landmark', e.target.value)}
                          placeholder="Landmark (e.g. Gokul Hotel)"
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={bp.address}
                          onChange={e => updateBoardingPoint(idx, 'address', e.target.value)}
                          placeholder="Address details"
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={bp.time}
                          onChange={e => updateBoardingPoint(idx, 'time', e.target.value)}
                          placeholder="Time (06:30 PM)"
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-mono focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeBoardingPointRow(idx)}
                          className="text-slate-400 hover:text-red-600 cursor-pointer p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Dropping Points Configurator */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                    Dropping Points & Arrival Times (Destination)
                  </span>
                  <button
                    type="button"
                    onClick={addDroppingPointRow}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Dropping Stop
                  </button>
                </div>

                <div className="space-y-2">
                  {droppingPointsList.map((dp, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 bg-white p-2 rounded-lg border border-slate-200 items-center">
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={dp.locationName}
                          onChange={e => updateDroppingPoint(idx, 'locationName', e.target.value)}
                          placeholder="Drop Stop (e.g. Majestic)"
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={dp.landmark}
                          onChange={e => updateDroppingPoint(idx, 'landmark', e.target.value)}
                          placeholder="Landmark (e.g. Exit Gate 2)"
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={dp.address}
                          onChange={e => updateDroppingPoint(idx, 'address', e.target.value)}
                          placeholder="Address details"
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={dp.time}
                          onChange={e => updateDroppingPoint(idx, 'time', e.target.value)}
                          placeholder="Time (09:30 AM)"
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-mono focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeDroppingPointRow(idx)}
                          className="text-slate-400 hover:text-red-600 cursor-pointer p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* SECTION 3: SCHEDULE & PRICING INFORMATION */}
            <div className="space-y-4 bg-slate-50/70 p-5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  3. Journey Schedule & Fare Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Journey Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={journeyDate}
                    onChange={e => setJourneyDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Departure Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={departureTime}
                    onChange={e => setDepartureTime(e.target.value)}
                    placeholder="e.g. 06:30 PM"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Arrival Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={arrivalTime}
                    onChange={e => setArrivalTime(e.target.value)}
                    placeholder="e.g. 09:30 AM"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Base Fare per Seat (₹) *
                  </label>
                  <input
                    type="number"
                    min="150"
                    max="10000"
                    required
                    value={basePrice}
                    onChange={e => setBasePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={isActiveStatus}
                    onChange={e => setIsActiveStatus(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 accent-orange-600"
                  />
                  <span>Mark schedule as Immediately Active in Search Results</span>
                </label>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('FLEET')}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:bg-slate-400 active:scale-98"
              >
                {isSubmitting ? (
                  <span>Saving Coach & Initializing Seats...</span>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Save Bus & Deploy Schedule to Network</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: ALL BOOKINGS MANIFEST                             */}
      {/* ======================================================== */}
      {activeTab === 'MANIFEST' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Confirmed Ticket Reservations Manifest ({bookings.length})
              </h2>
              <p className="text-xs text-slate-500">
                Audited list of verified passenger reservations, seat numbers, and Razorpay payment transactions.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 font-bold">
                <tr>
                  <th className="px-4 py-3">PNR Code</th>
                  <th className="px-4 py-3">Passenger</th>
                  <th className="px-4 py-3">Route & Schedule</th>
                  <th className="px-4 py-3">Seats</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Payment ID</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{b.pnr}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{b.passengers[0]?.name || 'Passenger'}</div>
                      <div className="text-[11px] text-slate-400">{b.userEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{b.schedule?.fromCity} → {b.schedule?.toCity}</div>
                      <div className="text-[11px] text-slate-400">{b.schedule?.departureTime}</div>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold">
                      {b.passengers.map(p => p.seatNumber).join(', ')}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      ₹{b.finalAmount}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {b.paymentId}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b.bookingStatus === 'CONFIRMED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {b.bookingStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
