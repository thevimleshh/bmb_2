import React, { useState, useEffect } from 'react';
import { Booking } from '../types';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';
import { Bus, Download, Navigation, Ban, Calendar, Clock, Sparkles, Coins, ArrowRight, ShieldCheck } from 'lucide-react';

interface MyBookingsViewProps {
  onTrackBus: (scheduleId: number) => void;
  onOpenCancellationModal: (booking: Booking) => void;
  onNavigateHome: () => void;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  onTrackBus,
  onOpenCancellationModal,
  onNavigateHome,
}) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'CANCELLED'>('UPCOMING');

  const userPoints = user?.loyaltyPoints ?? 280;

  const fetchBookings = async () => {
    try {
      const email = user?.email || 'rahul@example.com';
      const res = await fetch(`/api/bookings/my-bookings?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setBookings(data || []);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const handleDownloadPdf = (booking: Booking) => {
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 32, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('BMB - BOOK MY BUS E-TICKET', 14, 16);

    doc.setFontSize(10);
    doc.setTextColor(249, 115, 22);
    doc.text(`PNR: ${booking.pnr} | Status: ${booking.bookingStatus}`, 14, 25);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text('ROUTE DETAILS', 14, 44);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`From: ${booking.schedule.fromCity}`, 14, 52);
    doc.text(`To: ${booking.schedule.toCity}`, 110, 52);
    doc.text(`Date: ${booking.schedule.journeyDate}`, 14, 60);
    doc.text(`Departure: ${booking.schedule.departureTime}`, 110, 60);
    doc.text(`Boarding: ${booking.boardingPoint}`, 14, 68);
    doc.text(`Dropping: ${booking.droppingPoint}`, 14, 76);

    doc.setFont('helvetica', 'bold');
    doc.text('PASSENGERS & SEATS', 14, 90);
    doc.setFont('helvetica', 'normal');
    let y = 98;
    booking.passengers.forEach((p, i) => {
      doc.text(`${i + 1}. ${p.name} (${p.age} yrs, ${p.gender}) - Seat: ${p.seatNumber}`, 14, y);
      y += 8;
    });

    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount Paid: Rs. ${booking.finalAmount}`, 14, y + 8);
    if (booking.pointsEarned) {
      doc.text(`Loyalty Points Earned: +${booking.pointsEarned} Pts`, 14, y + 16);
    }
    doc.save(`BMB-Ticket-${booking.pnr}.pdf`);
  };

  const upcomingBookings = bookings.filter(b => b.bookingStatus === 'CONFIRMED');
  const cancelledBookings = bookings.filter(b => b.bookingStatus === 'CANCELLED');

  const displayedList = activeTab === 'UPCOMING' ? upcomingBookings : cancelledBookings;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      
      {/* Loyalty Points Rewards Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-orange-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-orange-600/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>BMB Loyalty Rewards Club</span>
              </span>
              <span className="text-xs text-slate-300 font-semibold">
                Tier: {userPoints >= 500 ? 'Platinum Member' : 'Gold Traveler (5% Rewards)'}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black font-mono text-white tabular-nums">
                {userPoints}
              </span>
              <span className="text-xl font-bold text-amber-400">
                BMB Points
              </span>
            </div>

            <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
              You have <strong className="text-white font-mono">₹{userPoints}.00</strong> worth of instant travel discount. 1 BMB Point = ₹1.00 off any bus ticket. Earn 5% back on every confirmed reservation!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onNavigateHome}
              className="px-5 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Redeem in New Booking</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            My Reservations & Vouchers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Access your e-tickets, check live GPS tracking, or manage journey cancellations.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('UPCOMING')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'UPCOMING'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Confirmed Journeys ({upcomingBookings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CANCELLED')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'CANCELLED'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cancelled ({cancelledBookings.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading your reservations...</div>
      ) : displayedList.length > 0 ? (
        <div className="space-y-4">
          {displayedList.map(booking => {
            const isConfirmed = booking.bookingStatus === 'CONFIRMED';
            return (
              <div
                key={booking.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-black text-slate-900">
                      {booking.pnr}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isConfirmed
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {booking.bookingStatus}
                    </span>

                    {/* Loyalty Points Tag */}
                    {booking.pointsEarned && isConfirmed && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>+{booking.pointsEarned} Pts Earned</span>
                      </span>
                    )}

                    {booking.pointsRedeemed && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        <span>-{booking.pointsRedeemed} Pts Used</span>
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-400">
                    Booked on: {new Date(booking.bookingDate).toLocaleDateString()}
                  </div>
                </div>

                {/* Journey Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center py-4">
                  <div className="md:col-span-4">
                    <div className="text-lg font-black text-slate-900">
                      {booking.schedule.fromCity} → {booking.schedule.toCity}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      {booking.schedule.bus?.operatorName} · {booking.schedule.bus?.busType}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Seats: <span className="font-mono font-bold text-slate-700">{booking.passengers.map(p => p.seatNumber).join(', ')}</span>
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{booking.schedule.journeyDate}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-800 font-mono flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{booking.schedule.departureTime}</span>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="text-xs text-slate-400">Total Paid</div>
                    <div className="text-lg font-black text-slate-900 font-mono tabular-nums">
                      ₹{booking.finalAmount}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-3 flex flex-wrap gap-2 justify-end">
                    {isConfirmed ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(booking)}
                          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF Ticket</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onTrackBus(booking.scheduleId)}
                          className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Track Bus</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenCancellationModal(booking)}
                          className="px-3 py-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      </>
                    ) : (
                      <div className="text-right text-xs">
                        <div className="text-red-600 font-semibold">Cancelled</div>
                        {booking.cancellation && (
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            Refund of ₹{booking.cancellation.refundAmount} ({booking.cancellation.refundPercentage}%) processed
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Boarding info */}
                <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex flex-wrap justify-between gap-2">
                  <div>
                    <span className="font-semibold text-slate-700">Boarding Point:</span> {booking.boardingPoint}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Payment ID:</span> <span className="font-mono">{booking.paymentId}</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Bus className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {activeTab === 'UPCOMING' ? 'No active bus bookings found' : 'No cancelled bookings'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeTab === 'UPCOMING'
              ? 'Ready for your next journey? Search available express buses and reserve your favorite berth with live seat lock.'
              : 'You have no cancelled tickets on file.'}
          </p>
          {activeTab === 'UPCOMING' && (
            <button
              onClick={onNavigateHome}
              className="mt-4 px-5 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition-colors cursor-pointer"
            >
              Search Buses Now →
            </button>
          )}
        </div>
      )}

    </div>
  );
};
