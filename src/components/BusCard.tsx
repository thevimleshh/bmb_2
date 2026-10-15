import React, { useState } from 'react';
import { Schedule } from '../types';
import { Wifi, BatteryCharging, ShieldCheck, Droplet, Star, Clock, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

interface BusCardProps {
  schedule: Schedule;
  onSelectSeats: (schedule: Schedule) => void;
  onTrackBus: (scheduleId: number) => void;
}

export const BusCard: React.FC<BusCardProps> = ({ schedule, onSelectSeats, onTrackBus }) => {
  const [showPoints, setShowPoints] = useState(false);
  const bus = schedule.bus;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow overflow-hidden">
      
      {/* Top Banner / Operator Details */}
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {bus?.operatorName || 'Express Fleet'}
              </h3>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-xs font-bold">
                <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                <span>{bus?.rating || '4.5'}</span>
              </div>
            </div>
            {/* Zero-Pill Unboxed Metadata with dot separators */}
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span>{bus?.busType || 'AC Sleeper'}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{bus?.busNumber || 'Fleet Vehicle'}</span>
              <span aria-hidden="true">·</span>
              <span className="text-orange-600 font-semibold">{schedule.availableSeats ?? 24} seats available</span>
            </div>
          </div>

          <div className="flex sm:flex-col items-baseline sm:items-end justify-between">
            <div className="text-xs text-slate-400 font-medium">Starts from</div>
            <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
              ₹{schedule.basePrice}
            </div>
          </div>
        </div>

        {/* Schedule & Route Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center py-5">
          
          {/* Departure */}
          <div className="md:col-span-3">
            <div className="text-xl font-black text-slate-900 font-mono">
              {schedule.departureTime}
            </div>
            <div className="text-sm font-semibold text-slate-700">
              {schedule.fromCity}
            </div>
            <div className="text-xs text-slate-400 truncate mt-0.5">
              {schedule.boardingPoints?.[0]?.locationName || 'Main Hub'}
            </div>
          </div>

          {/* Journey Duration Line */}
          <div className="md:col-span-4 flex flex-col items-center justify-center">
            <div className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{schedule.durationHours} hrs · {schedule.distanceKm} km</span>
            </div>
            <div className="w-full flex items-center gap-2">
              <div className="w-2 h-2 rounded-full border-2 border-orange-500 bg-white" />
              <div className="flex-1 border-t-2 border-dashed border-slate-300" />
              <div className="w-2 h-2 rounded-full bg-slate-800" />
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Express Highway Corridor</div>
          </div>

          {/* Arrival */}
          <div className="md:col-span-3 md:text-right">
            <div className="text-xl font-black text-slate-900 font-mono">
              {schedule.arrivalTime}
            </div>
            <div className="text-sm font-semibold text-slate-700">
              {schedule.toCity}
            </div>
            <div className="text-xs text-slate-400 truncate mt-0.5">
              {schedule.droppingPoints?.[schedule.droppingPoints.length - 1]?.locationName || 'City Terminal'}
            </div>
          </div>

          {/* Action CTA */}
          <div className="md:col-span-2 flex flex-col gap-2">
            <button
              onClick={() => onSelectSeats(schedule)}
              className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-xs active:scale-98 cursor-pointer text-center"
            >
              Select Seats
            </button>
            <button
              onClick={() => onTrackBus(schedule.id)}
              className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer text-center"
            >
              Live Location
            </button>
          </div>

        </div>

        {/* Amenities & Points Collapsible Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          
          <div className="flex items-center gap-4">
            {bus?.hasWifi && (
              <span className="flex items-center gap-1" title="Free High-Speed Wi-Fi">
                <Wifi className="w-3.5 h-3.5 text-slate-400" /> Wi-Fi
              </span>
            )}
            {bus?.hasCharging && (
              <span className="flex items-center gap-1" title="Mobile Charging Sockets">
                <BatteryCharging className="w-3.5 h-3.5 text-slate-400" /> Power Plug
              </span>
            )}
            {bus?.hasBlanket && (
              <span className="flex items-center gap-1" title="Fresh Bedding & Blanket">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Clean Blanket
              </span>
            )}
            {bus?.hasWaterBottle && (
              <span className="flex items-center gap-1" title="Complimentary Mineral Water">
                <Droplet className="w-3.5 h-3.5 text-slate-400" /> Water Bottle
              </span>
            )}
          </div>

          <button
            onClick={() => setShowPoints(!showPoints)}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-orange-600" />
            <span>Boarding & Dropping Points</span>
            {showPoints ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expanded Points Drawer */}
        {showPoints && (
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Boarding Stops ({schedule.fromCity})</span>
              </div>
              <div className="space-y-2">
                {schedule.boardingPoints && schedule.boardingPoints.length > 0 ? (
                  schedule.boardingPoints.map(point => (
                    <div key={point.id} className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-slate-800">{point.locationName}</div>
                        <div className="text-[11px] text-slate-400">{point.landmark}</div>
                      </div>
                      <div className="font-mono font-bold text-slate-700">{point.time}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400">Boarding at {schedule.fromCity} Main Bus Stand ({schedule.departureTime})</div>
                )}
              </div>
            </div>

            <div>
              <div className="font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>Dropping Stops ({schedule.toCity})</span>
              </div>
              <div className="space-y-2">
                {schedule.droppingPoints && schedule.droppingPoints.length > 0 ? (
                  schedule.droppingPoints.map(point => (
                    <div key={point.id} className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-slate-800">{point.locationName}</div>
                        <div className="text-[11px] text-slate-400">{point.landmark}</div>
                      </div>
                      <div className="font-mono font-bold text-slate-700">{point.time}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400">Dropping at {schedule.toCity} Terminal ({schedule.arrivalTime})</div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
