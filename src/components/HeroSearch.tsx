import React, { useState, useEffect, useRef } from 'react';
import { LocationItem } from '../types';
import { ArrowLeftRight, Calendar, Users, MapPin, Search, Bus, Building2, Compass, Check } from 'lucide-react';

interface HeroSearchProps {
  fromCity: string;
  setFromCity: (city: string) => void;
  toCity: string;
  setToCity: (city: string) => void;
  journeyDate: string;
  setJourneyDate: (date: string) => void;
  passengerCount: number;
  setPassengerCount: (count: number) => void;
  onSearch: () => void;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  fromCity,
  setFromCity,
  toCity,
  setToCity,
  journeyDate,
  setJourneyDate,
  passengerCount,
  setPassengerCount,
  onSearch,
}) => {
  const [fromQuery, setFromQuery] = useState(fromCity);
  const [toQuery, setToQuery] = useState(toCity);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [fromLocations, setFromLocations] = useState<LocationItem[]>([]);
  const [toLocations, setToLocations] = useState<LocationItem[]>([]);
  const [loadingFromLoc, setLoadingFromLoc] = useState(false);
  const [loadingToLoc, setLoadingToLoc] = useState(false);

  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFromQuery(fromCity);
  }, [fromCity]);

  useEffect(() => {
    setToQuery(toCity);
  }, [toCity]);

  // Fetch redBus-style locations for From input
  useEffect(() => {
    let active = true;
    const fetchLocs = async () => {
      setLoadingFromLoc(true);
      try {
        const res = await fetch(`/api/buses/locations?q=${encodeURIComponent(fromQuery)}`);
        const data = await res.json();
        if (active) {
          setFromLocations(data || []);
          setLoadingFromLoc(false);
        }
      } catch {
        if (active) setLoadingFromLoc(false);
      }
    };
    const debounce = setTimeout(fetchLocs, 150);
    return () => {
      active = false;
      clearTimeout(debounce);
    };
  }, [fromQuery]);

  // Fetch redBus-style locations for To input
  useEffect(() => {
    let active = true;
    const fetchLocs = async () => {
      setLoadingToLoc(true);
      try {
        const res = await fetch(`/api/buses/locations?q=${encodeURIComponent(toQuery)}`);
        const data = await res.json();
        if (active) {
          setToLocations(data || []);
          setLoadingToLoc(false);
        }
      } catch {
        if (active) setLoadingToLoc(false);
      }
    };
    const debounce = setTimeout(fetchLocs, 150);
    return () => {
      active = false;
      clearTimeout(debounce);
    };
  }, [toQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fromRef.current && !fromRef.current.contains(event.target as Node)) {
        setShowFromDropdown(false);
      }
      if (toRef.current && !toRef.current.contains(event.target as Node)) {
        setShowToDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const swapCities = () => {
    const tempCity = fromCity;
    const tempQuery = fromQuery;
    setFromCity(toCity);
    setToCity(tempCity);
    setFromQuery(toQuery);
    setToQuery(tempQuery);
  };

  const handleSelectFrom = (item: LocationItem) => {
    setFromCity(item.city);
    setFromQuery(item.name);
    setShowFromDropdown(false);
  };

  const handleSelectTo = (item: LocationItem) => {
    setToCity(item.city);
    setToQuery(item.name);
    setShowToDropdown(false);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0];

  const renderLocationIcon = (type: string) => {
    if (type === 'TERMINAL') {
      return <Bus className="w-4 h-4 text-orange-600 shrink-0" />;
    }
    if (type === 'MAJOR_HUB') {
      return <Compass className="w-4 h-4 text-emerald-600 shrink-0" />;
    }
    return <Building2 className="w-4 h-4 text-slate-500 shrink-0" />;
  };

  return (
    <div className="relative bg-slate-900 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
      <div className="max-w-6xl mx-auto">
        
        {/* Hero Title */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="text-orange-500 font-semibold text-xs tracking-wider uppercase mb-2">
            India's Most Reliable Intercity Fleet
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Seamless Bus Tickets with Instant Seat Confirmation
          </h1>
          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            Real location suggestions, pessimistic seat hold locks to prevent collision bookings, verified test checkout, and loyalty points on every trip.
          </p>
        </div>

        {/* Search Card Container */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 text-slate-900 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            
            {/* From City (redBus Style Location Selector) */}
            <div ref={fromRef} className="relative md:col-span-3">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                From (Boarding Hub)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-orange-600 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={fromQuery}
                  onChange={e => {
                    setFromQuery(e.target.value);
                    setShowFromDropdown(true);
                  }}
                  onFocus={() => setShowFromDropdown(true)}
                  placeholder="e.g. Borivali or Mumbai"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                />
              </div>

              {/* redBus-Style Autocomplete Dropdown */}
              {showFromDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100">
                  <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 border-b border-slate-200 flex justify-between">
                    <span>Popular Cities & Boarding Hubs</span>
                    {loadingFromLoc && <span className="text-orange-600">Searching...</span>}
                  </div>

                  {fromLocations.length > 0 ? (
                    fromLocations.map(loc => (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => handleSelectFrom(loc)}
                        className="w-full px-3 py-2.5 text-left hover:bg-orange-50/70 transition-colors flex items-center justify-between gap-2 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {renderLocationIcon(loc.type)}
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 group-hover:text-orange-900 truncate">
                              {loc.name}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                              <span>{loc.city}</span>
                              <span aria-hidden="true">·</span>
                              <span>{loc.state}</span>
                            </div>
                          </div>
                        </div>

                        {loc.tag && (
                          <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 group-hover:bg-orange-100 group-hover:text-orange-800">
                            {loc.tag}
                          </span>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-xs text-slate-500 text-center">
                      No matching terminal or city found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center md:col-span-1">
              <button
                type="button"
                onClick={swapCities}
                title="Swap departure and destination"
                className="w-10 h-10 rounded-full border border-slate-200 bg-slate-50 hover:bg-orange-50 hover:border-orange-300 text-slate-600 hover:text-orange-600 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* To City (redBus Style Location Selector) */}
            <div ref={toRef} className="relative md:col-span-3">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                To (Destination Hub)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-700 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={toQuery}
                  onChange={e => {
                    setToQuery(e.target.value);
                    setShowToDropdown(true);
                  }}
                  onFocus={() => setShowToDropdown(true)}
                  placeholder="e.g. Swargate or Pune"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                />
              </div>

              {/* redBus-Style Autocomplete Dropdown */}
              {showToDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100">
                  <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 border-b border-slate-200 flex justify-between">
                    <span>Popular Cities & Dropping Hubs</span>
                    {loadingToLoc && <span className="text-orange-600">Searching...</span>}
                  </div>

                  {toLocations.length > 0 ? (
                    toLocations.map(loc => (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => handleSelectTo(loc)}
                        className="w-full px-3 py-2.5 text-left hover:bg-orange-50/70 transition-colors flex items-center justify-between gap-2 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {renderLocationIcon(loc.type)}
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 group-hover:text-orange-900 truncate">
                              {loc.name}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                              <span>{loc.city}</span>
                              <span aria-hidden="true">·</span>
                              <span>{loc.state}</span>
                            </div>
                          </div>
                        </div>

                        {loc.tag && (
                          <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 group-hover:bg-orange-100 group-hover:text-orange-800">
                            {loc.tag}
                          </span>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-xs text-slate-500 text-center">
                      No matching terminal or city found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Journey Date */}
            <div className="md:col-span-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Date of Journey
                </label>
                <div className="flex gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setJourneyDate(todayStr)}
                    className={`font-semibold transition-colors cursor-pointer ${
                      journeyDate === todayStr ? 'text-orange-600 underline' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Today
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => setJourneyDate(tomorrowStr)}
                    className={`font-semibold transition-colors cursor-pointer ${
                      journeyDate === tomorrowStr ? 'text-orange-600 underline' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Tomorrow
                  </button>
                </div>
              </div>

              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="date"
                  value={journeyDate}
                  min={todayStr}
                  onChange={e => setJourneyDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all cursor-pointer"
                />
              </div>
            </div>

            {/* Search Buses Button */}
            <div className="md:col-span-2 pt-2 md:pt-4">
              <button
                type="button"
                onClick={onSearch}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Search className="w-4 h-4" />
                <span>Search Buses</span>
              </button>
            </div>
          </div>

          {/* Quick Route Shortcuts */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Popular redBus Corridors:</span>
            {[
              { from: 'Mumbai', to: 'Pune' },
              { from: 'Bangalore', to: 'Chennai' },
              { from: 'Delhi', to: 'Jaipur' },
              { from: 'Hyderabad', to: 'Bangalore' },
              { from: 'Mumbai', to: 'Goa' },
            ].map(route => (
              <button
                key={`${route.from}-${route.to}`}
                type="button"
                onClick={() => {
                  setFromCity(route.from);
                  setToCity(route.to);
                  setFromQuery(route.from);
                  setToQuery(route.to);
                  onSearch();
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-orange-100 hover:text-orange-800 rounded-lg text-slate-700 transition-colors font-medium cursor-pointer"
              >
                {route.from} → {route.to}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
