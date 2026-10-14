import React from 'react';
import { Booking } from '../types';
import { jsPDF } from 'jspdf';
import { CheckCircle2, Download, Printer, MapPin, Bus, User, Calendar, Clock, QrCode, X, ArrowRight } from 'lucide-react';

interface TicketSuccessModalProps {
  booking: Booking;
  onClose: () => void;
  onTrackBus: (scheduleId: number) => void;
  onViewMyBookings: () => void;
}

export const TicketSuccessModal: React.FC<TicketSuccessModalProps> = ({
  booking,
  onClose,
  onTrackBus,
  onViewMyBookings,
}) => {
  const schedule = booking.schedule;

  const downloadPdfTicket = () => {
    const doc = new jsPDF();

    // Primary Colors
    doc.setFillColor(15, 23, 42); // Navy (#0F172A)
    doc.rect(0, 0, 210, 36, 'F');

    // Header Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('BMB - BOOK MY BUS', 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(249, 115, 22); // Orange
    doc.text('OFFICIAL ELECTRONIC BUS PASSENGER TICKET', 14, 28);

    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(`PNR: ${booking.pnr}`, 150, 18);
    doc.setFontSize(9);
    doc.text(`STATUS: ${booking.bookingStatus}`, 150, 26);

    // Section 1: Route & Timings
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('JOURNEY & CARRIER INFORMATION', 14, 48);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Origin City: ${schedule.fromCity}`, 14, 56);
    doc.text(`Destination City: ${schedule.toCity}`, 110, 56);
    doc.text(`Journey Date: ${schedule.journeyDate}`, 14, 64);
    doc.text(`Departure Time: ${schedule.departureTime}`, 110, 64);
    doc.text(`Operator: ${schedule.bus?.operatorName || 'Intercity Express'}`, 14, 72);
    doc.text(`Bus Number: ${schedule.bus?.busNumber || 'N/A'}`, 110, 72);
    doc.text(`Bus Type: ${schedule.bus?.busType || 'AC Sleeper'}`, 14, 80);
    doc.text(`Estimated Duration: ${schedule.durationHours} Hours`, 110, 80);

    // Boarding Points
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 88, 182, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('BOARDING POINT:', 18, 96);
    doc.setFont('helvetica', 'normal');
    doc.text(booking.boardingPoint, 60, 96);
    doc.setFont('helvetica', 'bold');
    doc.text('DROPPING POINT:', 18, 104);
    doc.setFont('helvetica', 'normal');
    doc.text(booking.droppingPoint, 60, 104);

    // Passenger Manifest Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('PASSENGER MANIFEST & SEATS', 14, 122);

    // Table Header
    doc.setFillColor(226, 232, 240);
    doc.rect(14, 126, 182, 8, 'F');
    doc.setFontSize(9);
    doc.text('#', 18, 131);
    doc.text('Passenger Name', 30, 131);
    doc.text('Age', 110, 131);
    doc.text('Gender', 130, 131);
    doc.text('Seat Number', 160, 131);

    let startY = 140;
    doc.setFont('helvetica', 'normal');
    booking.passengers.forEach((p, idx) => {
      doc.text(`${idx + 1}`, 18, startY);
      doc.text(p.name, 30, startY);
      doc.text(`${p.age}`, 110, startY);
      doc.text(p.gender, 130, startY);
      doc.setFont('helvetica', 'bold');
      doc.text(p.seatNumber, 160, startY);
      doc.setFont('helvetica', 'normal');
      startY += 8;
    });

    // Payment & Fare Breakdown
    const fareY = startY + 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('PAYMENT SUMMARY', 14, fareY);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Base Fare: Rs. ${booking.totalAmount}`, 14, fareY + 8);
    doc.text(`Discount: Rs. ${booking.discountAmount}`, 14, fareY + 16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Net Amount Paid: Rs. ${booking.finalAmount}`, 14, fareY + 24);
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment ID: ${booking.paymentId}`, 110, fareY + 8);
    doc.text(`Payment Status: ${booking.paymentStatus}`, 110, fareY + 16);
    doc.text(`Booking Date: ${new Date(booking.bookingDate).toLocaleDateString()}`, 110, fareY + 24);

    // Footer Terms
    const footY = fareY + 40;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, footY, 196, footY);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('IMPORTANT INSTRUCTIONS:', 14, footY + 6);
    doc.text('1. Please arrive at the boarding point at least 15 minutes prior to scheduled departure.', 14, footY + 12);
    doc.text('2. Carry a valid government-issued photo ID (Aadhaar / Voter ID / Driving License / Passport).', 14, footY + 18);
    doc.text('3. For 24x7 helpline assistance and live tracking, visit bmb.travel or call 1800-BMB-HELP.', 14, footY + 24);

    // Save File
    doc.save(`BMB-Ticket-${booking.pnr}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto print:border-0 print:shadow-none">
        
        {/* Celebration Header */}
        <div className="bg-emerald-600 text-white p-6 text-center relative print:hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-14 h-14 bg-white text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black tracking-tight">Booking Confirmed!</h2>
          <p className="text-xs text-emerald-100 mt-1">
            Your e-ticket has been generated with PNR code{' '}
            <strong className="text-white font-mono">{booking.pnr}</strong>
          </p>
        </div>

        {/* Boarding Pass Ticket View */}
        <div className="p-6 space-y-6">
          
          {/* Ticket Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <div className="text-xl font-black text-slate-900 leading-none">BMB</div>
              <div className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Book My Bus e-Ticket</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 font-semibold uppercase">Booking PNR</div>
              <div className="text-lg font-black text-slate-900 font-mono tracking-wide">{booking.pnr}</div>
            </div>
          </div>

          {/* Route Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <div className="text-slate-400 font-medium">Departure</div>
              <div className="font-bold text-slate-900 font-mono text-sm">{schedule.departureTime}</div>
              <div className="text-slate-600 font-semibold">{schedule.fromCity}</div>
            </div>

            <div>
              <div className="text-slate-400 font-medium">Arrival</div>
              <div className="font-bold text-slate-900 font-mono text-sm">{schedule.arrivalTime}</div>
              <div className="text-slate-600 font-semibold">{schedule.toCity}</div>
            </div>

            <div>
              <div className="text-slate-400 font-medium">Date of Journey</div>
              <div className="font-bold text-slate-900">{schedule.journeyDate}</div>
              <div className="text-slate-600">{schedule.durationHours} hrs trip</div>
            </div>

            <div>
              <div className="text-slate-400 font-medium">Bus Details</div>
              <div className="font-bold text-slate-900 truncate">{schedule.bus?.operatorName}</div>
              <div className="text-slate-600 truncate">{schedule.bus?.busType}</div>
            </div>
          </div>

          {/* Boarding Landmark */}
          <div className="text-xs space-y-1.5 p-3 rounded-lg border border-slate-100 bg-white">
            <div><strong className="text-slate-800">Boarding Point:</strong> {booking.boardingPoint}</div>
            <div><strong className="text-slate-800">Dropping Point:</strong> {booking.droppingPoint}</div>
          </div>

          {/* Passengers & Seats Table */}
          <div>
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Passengers ({booking.passengers.length})
            </div>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
              {booking.passengers.map((p, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-900">{p.name}</span>
                    <span className="text-slate-400">({p.age} yrs · {p.gender})</span>
                  </div>
                  <div className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                    Seat {p.seatNumber}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fare & Payment ID */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
            <div>
              <span className="text-slate-400">Razorpay Ref: </span>
              <span className="font-mono font-semibold text-slate-700">{booking.paymentId}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 font-medium">Total Paid: </span>
              <span className="text-lg font-black text-slate-900 font-mono tabular-nums">₹{booking.finalAmount}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 print:hidden">
            <button
              onClick={downloadPdfTicket}
              className="py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download Official PDF Ticket</span>
            </button>

            <button
              onClick={handlePrint}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Boarding Pass</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 print:hidden text-xs">
            <button
              onClick={() => onTrackBus(schedule.id)}
              className="text-orange-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Track Bus Live on Highway Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onViewMyBookings}
              className="text-slate-600 hover:text-slate-900 font-medium hover:underline cursor-pointer"
            >
              View in My Bookings
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
