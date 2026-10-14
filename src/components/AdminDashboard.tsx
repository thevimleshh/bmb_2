import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Booking, Bus } from '../types';
import { Shield, Bus as BusIcon, TrendingUp, Users, PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'MANIFEST' | 'ADDBUS'>('MANIFEST');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    totalBuses: 5,
    totalRoutes: 9,
    totalBookings: 1,
    activeBookings: 1,
    totalRevenue: 1000,
    occupancyRate: '78.4%',
  });
  const [loading, setLoading] = useState(true);

  // New bus form state
  const [busNumber, setBusNumber] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [busType, setBusType] = useState('AC Sleeper (2+1)');
  const [fromCity, setFromCity] = useState('Mumbai');
  const [toCity, setToCity] = useState('Goa');
  const [departureTime, setDepartureTime] = useState('09:00 PM');
  const [arrivalTime, setArrivalTime] = useState('08:00 AM');
  const [basePrice, setBasePrice] = useState(850);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [statsRes, bookingsRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/bookings', { headers }),
      ]);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const handleAddBus = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    try {
      const res = await fetch('/api/admin/buses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          busNumber,
          operatorName,
          busType,
          totalSeats: 30,
          fromCity,
          toCity,
          departureTime,
          arrivalTime,
          basePrice,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to add bus');
        return;
      }

      setFormSuccess(`Bus ${busNumber} (${operatorName}) added to fleet successfully with 30 initialized seats.`);
      setBusNumber('');
      setOperatorName('');
      fetchAdminData();
    } catch {
      setFormError('Network error while creating bus schedule');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-orange-600" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Fleet Operations & Booking Manifest
          </h1>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('MANIFEST')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'MANIFEST'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Bookings Manifest
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ADDBUS')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ADDBUS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-orange-600" />
            <span>Add Bus & Schedule</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Fleet Buses</div>
          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-1">
            {stats.totalBuses} Active
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{stats.totalRoutes} Intercity Routes</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Reservations</div>
          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-1">
            {stats.totalBookings}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">{stats.activeBookings} Confirmed</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Gross Booking Revenue</div>
          <div className="text-2xl font-black text-orange-600 font-mono tabular-nums mt-1">
            ₹{stats.totalRevenue}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Verified via Razorpay</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Fleet Occupancy</div>
          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-1">
            {stats.occupancyRate}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Average Seat Utilization</div>
        </div>
      </div>

      {/* Tab 1: All Bookings Manifest Table */}
      {activeTab === 'MANIFEST' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Recent System Reservations ({bookings.length})
            </h2>
            <div className="text-xs text-slate-400">Real-time Passenger Manifest</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">PNR</th>
                  <th className="px-4 py-3">Traveler</th>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Seats</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Payment ID</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{b.pnr}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{b.passengers[0]?.name || 'Passenger'}</div>
                      <div className="text-[11px] text-slate-400">{b.userEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{b.schedule.fromCity} → {b.schedule.toCity}</div>
                      <div className="text-[11px] text-slate-400">{b.schedule.departureTime}</div>
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

      {/* Tab 2: Add Bus Form */}
      {activeTab === 'ADDBUS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 max-w-2xl">
          <h2 className="text-base font-bold text-slate-900 mb-1">
            Register New Coach & Schedule
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Adding a bus creates a new schedule and automatically initializes Lower and Upper deck seat inventories.
          </p>

          {formSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleAddBus} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bus Registration Number
                </label>
                <input
                  type="text"
                  required
                  value={busNumber}
                  onChange={e => setBusNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. MH-04-AX-5522"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Fleet Operator Name
                </label>
                <input
                  type="text"
                  required
                  value={operatorName}
                  onChange={e => setOperatorName(e.target.value)}
                  placeholder="e.g. Orange Travels Express"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Coach Configuration
                </label>
                <select
                  value={busType}
                  onChange={e => setBusType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="AC Sleeper (2+1)">AC Sleeper (2+1)</option>
                  <option value="Volvo Multi-Axle AC Sleeper">Volvo Multi-Axle AC Sleeper</option>
                  <option value="BharatBenz AC Seater (2+2)">BharatBenz AC Seater (2+2)</option>
                  <option value="Non-AC Sleeper">Non-AC Sleeper</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Base Ticket Price (₹)
                </label>
                <input
                  type="number"
                  min="200"
                  max="5000"
                  required
                  value={basePrice}
                  onChange={e => setBasePrice(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  From City
                </label>
                <input
                  type="text"
                  required
                  value={fromCity}
                  onChange={e => setFromCity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  To City
                </label>
                <input
                  type="text"
                  required
                  value={toCity}
                  onChange={e => setToCity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Departure Time
                </label>
                <input
                  type="text"
                  required
                  value={departureTime}
                  onChange={e => setDepartureTime(e.target.value)}
                  placeholder="e.g. 09:30 PM"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Arrival Time
                </label>
                <input
                  type="text"
                  required
                  value={arrivalTime}
                  onChange={e => setArrivalTime(e.target.value)}
                  placeholder="e.g. 06:30 AM"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-slate-900 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer mt-4"
            >
              Add Coach to Network & Initialize Seats
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
