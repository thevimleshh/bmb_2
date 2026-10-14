import React, { useState, useEffect } from 'react';
import { Schedule, SeatItem, BoardingPoint } from '../types';
import { X, Clock, AlertCircle, Check, MapPin, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

interface SeatMapModalProps {
  schedule: Schedule;
  sessionId: string;
  onClose: () => void;
  onProceedToPassengerDetails: (data: {
    selectedSeats: SeatItem[];
    boardingPoint: BoardingPoint;
    droppingPoint: BoardingPoint;
    totalAmount: number;
    lockExpiresAt: number;
  }) => void;
}

export const SeatMapModal: React.FC<SeatMapModalProps> = ({
  schedule,
  sessionId,
  onClose,
  onProceedToPassengerDetails,
}) => {
  const [seats, setSeats] = useState<SeatItem[]>([]);
  const [boardingPoints, setBoardingPoints] = useState<BoardingPoint[]>([]);
  const [droppingPoints, setDroppingPoints] = useState<BoardingPoint[]>([]);
  const [selectedSeatNumbers, setSelectedSeatNumbers] = useState<string[]>([]);
  const [selectedBoardingId, setSelectedBoardingId] = useState<number | null>(null);
  const [selectedDroppingId, setSelectedDroppingId] = useState<number | null>(null);
  const [activeDeck, setActiveDeck] = useState<'LOWER' | 'UPPER'>('LOWER');
  
  // Accordion open/close state for the two selectors
  const [isBoardingOpen, setIsBoardingOpen] = useState<boolean>(true);
  const [isDroppingOpen, setIsDroppingOpen] = useState<boolean>(true);
  const [activePointTab, setActivePointTab] = useState<'BOARDING' | 'DROPPING'>('BOARDING');

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Seat hold timer state
  const [lockExpiresAt, setLockExpiresAt] = useState<number | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [lockingInProgress, setLockingInProgress] = useState<boolean>(false);

  // Load seats & boarding/dropping points from backend API
  const fetchSeatsAndPoints = async () => {
    try {
      // 1. Fetch seats and points from existing schedule endpoint
      const res = await fetch(`/api/buses/${schedule.id}/seats`);
      const data = await res.json();
      
      let bPoints: BoardingPoint[] = data.boardingPoints || [];
      let dPoints: BoardingPoint[] = data.droppingPoints || [];

      // Fallback to dedicated points endpoint if empty
      if (!bPoints.length || !dPoints.length) {
        try {
          const pointsRes = await fetch(`/api/buses/${schedule.id}/points`);
          if (pointsRes.ok) {
            const pointsData = await pointsRes.json();
            bPoints = pointsData.boardingPoints || [];
            dPoints = pointsData.droppingPoints || [];
          }
        } catch {
          // ignore fallback error
        }
      }

      setSeats(data.seats || []);
      setBoardingPoints(bPoints);
      setDroppingPoints(dPoints);

      // Auto-select initial points if none selected yet
      if (bPoints.length > 0 && selectedBoardingId === null) {
        setSelectedBoardingId(bPoints[0].id);
      }
      if (dPoints.length > 0 && selectedDroppingId === null) {
        setSelectedDroppingId(dPoints[0].id);
      }

      setLoading(false);
    } catch {
      setErrorMsg('Failed to load seat layout and boarding points. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeatsAndPoints();
    const interval = setInterval(fetchSeatsAndPoints, 12000); // Polling for seat updates
    return () => clearInterval(interval);
  }, [schedule.id]);

  // Countdown timer for seat locks
  useEffect(() => {
    if (!lockExpiresAt) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((lockExpiresAt - Date.now()) / 1000));
      setTimeLeftSeconds(remaining);
      if (remaining <= 0) {
        setLockExpiresAt(null);
        setSelectedSeatNumbers([]);
        setErrorMsg('Your 10-minute seat hold has expired. The seats have been released back to the pool.');
        fetchSeatsAndPoints();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockExpiresAt]);

  const toggleSeat = (seat: SeatItem) => {
    if (seat.status === 'BOOKED') return;
    if (seat.status === 'LOCKED' && seat.lockedBySession !== sessionId) {
      setErrorMsg(`Seat ${seat.seatNumber} is currently held by another passenger.`);
      return;
    }

    setErrorMsg(null);
    if (selectedSeatNumbers.includes(seat.seatNumber)) {
      setSelectedSeatNumbers(prev => prev.filter(n => n !== seat.seatNumber));
    } else {
      if (selectedSeatNumbers.length >= 6) {
        setErrorMsg('You can select up to 6 seats in a single reservation.');
        return;
      }
      setSelectedSeatNumbers(prev => [...prev, seat.seatNumber]);
    }
  };

  const selectedSeats = seats.filter(s => selectedSeatNumbers.includes(s.seatNumber));
  const totalAmount = selectedSeats.reduce((acc, curr) => acc + curr.price, 0);

  const selectedBoardingPoint = boardingPoints.find(p => p.id === selectedBoardingId) || null;
  const selectedDroppingPoint = droppingPoints.find(p => p.id === selectedDroppingId) || null;

  const handleLockAndContinue = async () => {
    if (selectedSeats.length === 0) {
      setErrorMsg('Please select at least one seat to continue.');
      return;
    }

    if (!selectedBoardingPoint) {
      setErrorMsg('Please choose your Boarding Point to proceed.');
      setIsBoardingOpen(true);
      setActivePointTab('BOARDING');
      return;
    }

    if (!selectedDroppingPoint) {
      setErrorMsg('Please choose your Dropping Point to proceed.');
      setIsDroppingOpen(true);
      setActivePointTab('DROPPING');
      return;
    }

    // Validate points belong to the selected bus & schedule
    if (selectedBoardingPoint.scheduleId !== schedule.id || selectedDroppingPoint.scheduleId !== schedule.id) {
      setErrorMsg('Selected boarding or dropping point is invalid for this route.');
      return;
    }

    setLockingInProgress(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/buses/${schedule.id}/lock-seats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatNumbers: selectedSeatNumbers,
          sessionId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'One or more selected seats were just taken. Please pick another seat.');
        setLockingInProgress(false);
        fetchSeatsAndPoints();
        return;
      }

      setLockExpiresAt(data.expiresAt);
      setTimeLeftSeconds(data.expiresInSeconds);

      onProceedToPassengerDetails({
        selectedSeats,
        boardingPoint: selectedBoardingPoint,
        droppingPoint: selectedDroppingPoint,
        totalAmount,
        lockExpiresAt: data.expiresAt,
      });
    } catch {
      setErrorMsg('Network error while securing seat hold. Please retry.');
    } finally {
      setLockingInProgress(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="text-xs font-bold text-orange-400 uppercase tracking-wider">
              {schedule.bus?.operatorName} · {schedule.bus?.busType}
            </div>
            <h3 className="text-lg font-black tracking-tight text-white">
              Select Your Seats & Stops ({schedule.fromCity} → {schedule.toCity})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lock Expiry Alert Banner */}
        {lockExpiresAt && timeLeftSeconds > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between text-xs text-amber-800 shrink-0">
            <div className="flex items-center gap-2 font-medium">
              <Clock className="w-4 h-4 text-amber-600 animate-spin" />
              <span>Temporary Seat Lock Active: Your seats are held safely.</span>
            </div>
            <div className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
              Time Left: {formatTimer(timeLeftSeconds)}
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-2.5 flex items-center gap-2 text-xs font-semibold text-red-700 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: 2D Bus Deck Layout (Col 7) */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-4">
            
            {/* Deck Toggle Tabs */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveDeck('LOWER')}
                  className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                    activeDeck === 'LOWER'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Lower Deck (L1 - L15)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDeck('UPPER')}
                  className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                    activeDeck === 'UPPER'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Upper Deck (U1 - U15)
                </button>
              </div>

              <div className="text-[11px] text-slate-400 font-medium">
                Click seat to select
              </div>
            </div>

            {/* Seat Legend */}
            <div className="grid grid-cols-4 gap-2 text-[11px] p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-600">
                <div className="w-3.5 h-5 rounded border border-slate-300 bg-white" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <div className="w-3.5 h-5 rounded bg-orange-600 border border-orange-600 text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <div className="w-3.5 h-5 rounded bg-amber-400 border border-amber-500" />
                <span>Held</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <div className="w-3.5 h-5 rounded bg-slate-300 border border-slate-400" />
                <span>Booked</span>
              </div>
            </div>

            {/* 2D Bus Chassis */}
            <div className="p-5 bg-slate-100 rounded-2xl border-2 border-slate-300 relative">
              {/* Front Cabin / Steering Wheel */}
              <div className="flex justify-between items-center pb-3 mb-3 border-b-2 border-dashed border-slate-300 text-xs font-bold text-slate-400 uppercase">
                <span>Front / Entry</span>
                <div className="flex items-center gap-1 px-2.5 py-1 bg-white rounded-md border border-slate-300 text-slate-700">
                  <span>☸ Driver Cabin</span>
                </div>
              </div>

              {loading ? (
                <div className="py-16 text-center text-xs text-slate-500 font-medium">
                  Loading seating configuration & stops...
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5">
                  {seats
                    .filter(s => s.deck === activeDeck)
                    .map(seat => {
                      const isSelected = selectedSeatNumbers.includes(seat.seatNumber);
                      const isBooked = seat.status === 'BOOKED';
                      const isLocked = seat.status === 'LOCKED' && seat.lockedBySession !== sessionId;

                      let seatStyle = 'bg-white border-slate-300 text-slate-800 hover:border-orange-500';
                      if (isSelected) {
                        seatStyle = 'bg-orange-600 border-orange-600 text-white font-bold shadow-md';
                      } else if (isBooked) {
                        seatStyle = 'bg-slate-300 border-slate-400 text-slate-500 cursor-not-allowed';
                      } else if (isLocked) {
                        seatStyle = 'bg-amber-100 border-amber-400 text-amber-800 cursor-not-allowed';
                      }

                      return (
                        <button
                          key={seat.id}
                          type="button"
                          disabled={isBooked || isLocked}
                          onClick={() => toggleSeat(seat)}
                          className={`h-15 rounded-xl border-2 flex flex-col items-center justify-center p-1 transition-all cursor-pointer relative ${seatStyle}`}
                        >
                          <div className="text-xs font-mono font-bold leading-tight">
                            {seat.seatNumber}
                          </div>
                          <div className="text-[10px] opacity-85 mt-0.5 font-mono">
                            ₹{seat.price}
                          </div>
                          {seat.isWindow && (
                            <span className="absolute top-1 right-1 text-[8px] opacity-60 font-bold">
                              W
                            </span>
                          )}
                          {isSelected && (
                            <Check className="w-3 h-3 absolute bottom-1 right-1" />
                          )}
                        </button>
                      );
                    })}
                </div>
              )}

              <div className="mt-3 pt-2 border-t border-slate-200 text-center text-[10px] text-slate-400">
                Rear of Bus / Engine
              </div>
            </div>

          </div>

          {/* Right Column: Boarding Point & Dropping Point Selectors (Col 5 / 6) */}
          <div className="lg:col-span-6 xl:col-span-5 space-y-4 flex flex-col justify-between">
            
            <div className="space-y-4">
              
              {/* Segmented Tab Switcher for Quick Mobile/Desktop Navigation */}
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setActivePointTab('BOARDING');
                    setIsBoardingOpen(true);
                  }}
                  className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    activePointTab === 'BOARDING'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-orange-600" />
                  <span>Boarding ({boardingPoints.length})</span>
                  {selectedBoardingPoint && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActivePointTab('DROPPING');
                    setIsDroppingOpen(true);
                  }}
                  className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    activePointTab === 'DROPPING'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-red-600" />
                  <span>Dropping ({droppingPoints.length})</span>
                  {selectedDroppingPoint && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 ml-0.5" />
                  )}
                </button>
              </div>

              {/* 1. Interactive Clickable Boarding Point Selector Card */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                {/* Clickable Header Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsBoardingOpen(!isBoardingOpen);
                    setActivePointTab('BOARDING');
                  }}
                  className="w-full p-3.5 bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between cursor-pointer border-b border-slate-200"
                >
                  <div className="flex items-center gap-2 text-left">
                    <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        CHOOSE BOARDING POINT ({schedule.fromCity})
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {selectedBoardingPoint ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {selectedBoardingPoint.locationName} ({selectedBoardingPoint.time})
                          </span>
                        ) : (
                          <span className="text-orange-600 font-medium">Select pickup stop (Required)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-slate-500 p-1">
                    {isBoardingOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {/* Collapsible Options List */}
                {isBoardingOpen && (
                  <div className="p-3 space-y-2 max-h-48 overflow-y-auto bg-slate-50/50">
                    {boardingPoints.length > 0 ? (
                      boardingPoints.map(bp => {
                        const isSelected = selectedBoardingId === bp.id;
                        return (
                          <div
                            key={bp.id}
                            onClick={() => {
                              setSelectedBoardingId(bp.id);
                              setErrorMsg(null);
                            }}
                            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-3 ${
                              isSelected
                                ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-500/20 text-orange-950 font-bold shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              {/* Custom Radio Circle */}
                              <div
                                className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'border-orange-600 bg-orange-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>

                              <div>
                                <div className="text-xs font-bold leading-tight">
                                  {bp.locationName}
                                </div>
                                <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                                  {bp.landmark}
                                </div>
                                {bp.address && (
                                  <div className="text-[10px] text-slate-400 font-normal">
                                    {bp.address}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                                  isSelected
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                <Clock className="w-3 h-3" />
                                {bp.time}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No specific boarding stops found for this bus.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Interactive Clickable Dropping Point Selector Card */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                {/* Clickable Header Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsDroppingOpen(!isDroppingOpen);
                    setActivePointTab('DROPPING');
                  }}
                  className="w-full p-3.5 bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between cursor-pointer border-b border-slate-200"
                >
                  <div className="flex items-center gap-2 text-left">
                    <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        CHOOSE DROPPING POINT ({schedule.toCity})
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {selectedDroppingPoint ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {selectedDroppingPoint.locationName} ({selectedDroppingPoint.time})
                          </span>
                        ) : (
                          <span className="text-red-600 font-medium">Select drop-off stop (Required)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-slate-500 p-1">
                    {isDroppingOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {/* Collapsible Options List */}
                {isDroppingOpen && (
                  <div className="p-3 space-y-2 max-h-48 overflow-y-auto bg-slate-50/50">
                    {droppingPoints.length > 0 ? (
                      droppingPoints.map(dp => {
                        const isSelected = selectedDroppingId === dp.id;
                        return (
                          <div
                            key={dp.id}
                            onClick={() => {
                              setSelectedDroppingId(dp.id);
                              setErrorMsg(null);
                            }}
                            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-3 ${
                              isSelected
                                ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-500/20 text-orange-950 font-bold shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              {/* Custom Radio Circle */}
                              <div
                                className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'border-orange-600 bg-orange-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>

                              <div>
                                <div className="text-xs font-bold leading-tight">
                                  {dp.locationName}
                                </div>
                                <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                                  {dp.landmark}
                                </div>
                                {dp.address && (
                                  <div className="text-[10px] text-slate-400 font-normal">
                                    {dp.address}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                                  isSelected
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                <Clock className="w-3 h-3" />
                                {dp.time}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No specific dropping stops found for this bus.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Detailed Booking & Stops Summary Box */}
              <div className="p-4 bg-slate-900 text-white rounded-xl shadow-xs space-y-2.5 text-xs">
                <div className="text-[11px] font-bold text-orange-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2">
                  <span>Selected Journey Stops Summary</span>
                  <span>{selectedSeats.length} Seat(s)</span>
                </div>

                {/* Selected Seats summary */}
                <div className="flex justify-between items-center text-slate-300">
                  <span>Seats Chosen:</span>
                  <div className="flex flex-wrap gap-1 font-mono font-bold text-white">
                    {selectedSeats.length > 0 ? (
                      selectedSeats.map(s => (
                        <span key={s.seatNumber} className="bg-slate-800 px-1.5 py-0.5 rounded text-orange-400">
                          {s.seatNumber}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 italic font-sans font-normal">None selected yet</span>
                    )}
                  </div>
                </div>

                {/* Selected Boarding summary */}
                <div className="text-slate-300">
                  <div className="font-semibold text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Pickup:
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {selectedBoardingPoint ? selectedBoardingPoint.time : '--:--'}
                    </span>
                  </div>
                  {selectedBoardingPoint ? (
                    <div className="text-[11px] text-slate-400 truncate pl-3">
                      {selectedBoardingPoint.locationName} ({selectedBoardingPoint.landmark})
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-400 italic pl-3">
                      ⚠️ Please select a boarding point
                    </div>
                  )}
                </div>

                {/* Selected Dropping summary */}
                <div className="text-slate-300">
                  <div className="font-semibold text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Drop-off:
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {selectedDroppingPoint ? selectedDroppingPoint.time : '--:--'}
                    </span>
                  </div>
                  {selectedDroppingPoint ? (
                    <div className="text-[11px] text-slate-400 truncate pl-3">
                      {selectedDroppingPoint.locationName} ({selectedDroppingPoint.landmark})
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-400 italic pl-3">
                      ⚠️ Please select a dropping point
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Total Fare & Lock Action */}
            <div className="pt-3 border-t border-slate-200 space-y-2.5">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold text-slate-600">Total Base Fare:</span>
                <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                  ₹{totalAmount}
                </span>
              </div>

              <button
                type="button"
                disabled={selectedSeats.length === 0 || !selectedBoardingPoint || !selectedDroppingPoint || lockingInProgress}
                onClick={handleLockAndContinue}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {lockingInProgress ? (
                  <span>Securing Seat Hold...</span>
                ) : (
                  <span>Lock Seats & Fill Passenger Info →</span>
                )}
              </button>

              {(!selectedBoardingPoint || !selectedDroppingPoint || selectedSeats.length === 0) && (
                <div className="text-[11px] text-center text-slate-500">
                  {selectedSeats.length === 0
                    ? '1. Pick your seat(s) on the bus layout'
                    : !selectedBoardingPoint
                    ? '2. Select your pickup Boarding Point above'
                    : !selectedDroppingPoint
                    ? '3. Select your destination Dropping Point above'
                    : 'Ready to proceed'}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
