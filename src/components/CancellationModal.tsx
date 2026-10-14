import React, { useState } from 'react';
import { Booking } from '../types';
import { X, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface CancellationModalProps {
  booking: Booking;
  onClose: () => void;
  onCancellationSuccess: () => void;
}

export const CancellationModal: React.FC<CancellationModalProps> = ({
  booking,
  onClose,
  onCancellationSuccess,
}) => {
  const [reason, setReason] = useState('Change of travel plan');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cancellation policy breakdown:
  // For demo, assume >12 hours window -> 70% or 80% refund
  const refundPercentage = 80;
  const refundAmount = Math.round((booking.finalAmount * refundPercentage) / 100);

  const handleConfirmCancel = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to cancel booking');
        setSubmitting(false);
        return;
      }
      onCancellationSuccess();
    } catch {
      setErrorMsg('Network error while processing cancellation');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-white" />
            <h3 className="text-base font-extrabold tracking-tight">
              Cancel Reservation (PNR: {booking.pnr})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          <div className="text-xs text-slate-600">
            You are requesting to cancel bus ticket for <strong>{booking.schedule.fromCity} → {booking.schedule.toCity}</strong> scheduled on <strong>{booking.schedule.journeyDate}</strong> ({booking.passengers.length} passengers).
          </div>

          {/* Refund Rules Table */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              BMB Standard Cancellation & Refund Policy
            </div>
            <div className="divide-y divide-slate-200 text-slate-600">
              <div className="py-1.5 flex justify-between">
                <span>Before 24 hrs of departure:</span>
                <span className="font-bold text-emerald-700">90% Refund</span>
              </div>
              <div className="py-1.5 flex justify-between bg-emerald-50/50 px-1 rounded font-medium">
                <span>Between 12 to 24 hrs of departure (Current):</span>
                <span className="font-bold text-emerald-700">80% Refund</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span>Between 2 to 12 hrs of departure:</span>
                <span className="font-bold text-amber-700">50% Refund</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span>Within 2 hrs of departure:</span>
                <span className="font-bold text-red-700">Non-refundable</span>
              </div>
            </div>
          </div>

          {/* Calculated Refund */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
            <div>
              <div className="text-emerald-800 font-medium">Estimated Refund Amount ({refundPercentage}%)</div>
              <div className="text-[11px] text-emerald-600 mt-0.5">Credited to original Razorpay payment source within 3-5 banking days.</div>
            </div>
            <div className="text-2xl font-black text-emerald-800 font-mono tabular-nums">
              ₹{refundAmount}
            </div>
          </div>

          {/* Reason selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Reason for Cancellation
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              <option value="Change of travel plan">Change of travel plan</option>
              <option value="Personal emergency">Personal emergency</option>
              <option value="Booked alternate transport">Booked alternate transport</option>
              <option value="Incorrect date or bus chosen">Incorrect date or bus chosen</option>
            </select>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* Action CTAs */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Keep My Ticket
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleConfirmCancel}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-98"
            >
              {submitting ? 'Processing...' : `Confirm Cancellation & Refund ₹${refundAmount}`}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
