import React, { useState, useMemo } from 'react';
import { Schedule } from '../types';
import { BusCard } from './BusCard';
import { Filter, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

interface BusResultsProps {
  schedules: Schedule[];
  fromCity: string;
  toCity: string;
  journeyDate: string;
  onSelectSeats: (schedule: Schedule) => void;
  onTrackBus: (scheduleId: number) => void;
}

export const BusResults: React.FC<BusResultsProps> = ({
  schedules,
  fromCity,
  toCity,
  journeyDate,
  onSelectSeats,
  onTrackBus,
}) => {
  const [selectedBusTypes, setSelectedBusTypes] = useState<string[]>([]);
  const [selectedOperators, setSelectedOperators] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(2000);
  const [timeSlot, setTimeSlot] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('CHEAPEST');

  // Extract unique operators
  const operators = useMemo(() => {
    const list = new Set<string>();
    schedules.forEach(s => {
      if (s.bus?.operatorName) list.add(s.bus.operatorName);
    });
    return Array.from(list);
  }, [schedules]);

  const toggleOperator = (op: string) => {
    setSelectedOperators(prev =>
      prev.includes(op) ? prev.filter(x => x !== op) : [...prev, op]
    );
  };

  const toggleBusType = (type: string) => {
    setSelectedBusTypes(prev =>
      prev.includes(type) ? prev.filter(x => x !== type) : [...prev, type]
    );
  };

  const filteredSchedules = useMemo(() => {
    return schedules
      .filter(s => {
        // Price filter
        if (s.basePrice > maxPrice) return false;

        // Operator filter
        if (selectedOperators.length > 0 && s.bus?.operatorName) {
          if (!selectedOperators.includes(s.bus.operatorName)) return false;
        }

        // Bus type filter
        if (selectedBusTypes.length > 0 && s.bus?.busType) {
          const matches = selectedBusTypes.some(type =>
            s.bus?.busType.toLowerCase().includes(type.toLowerCase())
          );
          if (!matches) return false;
        }

        // Time slot filter
        if (timeSlot !== 'ALL') {
          const depHour = parseInt(s.departureTime.split(':')[0], 10);
          const isPM = s.departureTime.includes('PM');
          const hour24 = isPM && depHour !== 12 ? depHour + 12 : (!isPM && depHour === 12 ? 0 : depHour);

          if (timeSlot === 'MORNING' && !(hour24 >= 6 && hour24 < 12)) return false;
          if (timeSlot === 'AFTERNOON' && !(hour24 >= 12 && hour24 < 18)) return false;
          if (timeSlot === 'EVENING' && !(hour24 >= 18 && hour24 < 24)) return false;
          if (timeSlot === 'NIGHT' && !(hour24 >= 0 && hour24 < 6)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'CHEAPEST') return a.basePrice - b.basePrice;
        if (sortBy === 'EXPENSIVE') return b.basePrice - a.basePrice;
        if (sortBy === 'DURATION') return a.durationHours - b.durationHours;
        if (sortBy === 'RATING') return (b.bus?.rating || 0) - (a.bus?.rating || 0);
        return 0;
      });
  }, [schedules, maxPrice, selectedOperators, selectedBusTypes, timeSlot, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Route & Count Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {fromCity} → {toCity}
          </h2>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>Date: {journeyDate}</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-slate-700">{filteredSchedules.length} Buses Available</span>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" /> Sort By:
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {[
              { id: 'CHEAPEST', label: 'Cheapest' },
              { id: 'DURATION', label: 'Fastest' },
              { id: 'RATING', label: 'Top Rated' },
            ].map(option => (
              <button
                key={option.id}
                onClick={() => setSortBy(option.id)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  sortBy === option.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        
        {/* Filters Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Filter className="w-4 h-4 text-orange-600" />
                <span>Filter Buses</span>
              </div>
              <button
                onClick={() => {
                  setSelectedBusTypes([]);
                  setSelectedOperators([]);
                  setMaxPrice(2000);
                  setTimeSlot('ALL');
                }}
                className="text-[11px] text-orange-600 font-semibold hover:underline cursor-pointer"
              >
                Reset All
              </button>
            </div>

            {/* Departure Time Slots */}
            <div>
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Departure Time
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {[
                  { id: 'ALL', label: 'All Times' },
                  { id: 'MORNING', label: '06:00 - 12:00' },
                  { id: 'AFTERNOON', label: '12:00 - 18:00' },
                  { id: 'EVENING', label: '18:00 - 24:00' },
                ].map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => setTimeSlot(slot.id)}
                    className={`py-1.5 px-2 rounded-lg text-center font-medium border transition-colors cursor-pointer ${
                      timeSlot === slot.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                <span>Max Base Fare</span>
                <span className="font-mono text-orange-600 text-sm">₹{maxPrice}</span>
              </div>
              <input
                type="range"
                min="400"
                max="2000"
                step="50"
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full accent-orange-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                <span>₹400</span>
                <span>₹2000</span>
              </div>
            </div>

            {/* Bus Types */}
            <div>
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Bus Model / Deck
              </div>
              <div className="space-y-2 text-xs">
                {['Sleeper', 'Seater', 'Volvo', 'Multi-Axle'].map(type => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedBusTypes.includes(type)}
                      onChange={() => toggleBusType(type)}
                      className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 accent-orange-600"
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Bus Operators */}
            <div>
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Operators
              </div>
              <div className="space-y-2 text-xs max-h-40 overflow-y-auto">
                {operators.map(op => (
                  <label key={op} className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedOperators.includes(op)}
                      onChange={() => toggleOperator(op)}
                      className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 accent-orange-600"
                    />
                    <span className="truncate">{op}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>
        </aside>

        {/* Results Stream */}
        <main className="lg:col-span-9 space-y-4">
          {filteredSchedules.length > 0 ? (
            filteredSchedules.map(schedule => (
              <BusCard
                key={schedule.id}
                schedule={schedule}
                onSelectSeats={onSelectSeats}
                onTrackBus={onTrackBus}
              />
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-3">
                <SlidersHorizontal className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No buses match your filters</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try widening your price range, clearing bus type restrictions, or selecting a different departure time window.
              </p>
              <button
                onClick={() => {
                  setSelectedBusTypes([]);
                  setSelectedOperators([]);
                  setMaxPrice(2000);
                  setTimeSlot('ALL');
                }}
                className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </main>

      </div>
    </div>
  );
};
