import React from 'react';
import { Bus, ShieldCheck, Clock, Users, Phone, Mail, Award, CheckCircle2 } from 'lucide-react';

export const AboutUsView: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Hero Narrative */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="text-orange-600 font-bold text-xs uppercase tracking-wider">
          About BMB · Book My Bus
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Pioneering Safe, Predictable & Comfortable Intercity Bus Travel
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Founded with a mission to eliminate uncertainty in long-distance bus journeys, BMB connects thousands of travelers daily with India's premier bus operators through verified schedules, guaranteed seat reservations, and real-time highway telematics.
        </p>
      </div>

      {/* Quantitative Rigor Stats Strip (Clean, unboxed) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-slate-900 text-white rounded-2xl shadow-xl">
        <div className="text-center p-3">
          <div className="text-3xl font-black font-mono text-orange-500 tabular-nums">500+</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Luxury Sleeper Coaches</div>
        </div>
        <div className="text-center p-3">
          <div className="text-3xl font-black font-mono text-white tabular-nums">1,200+</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Daily Intercity Routes</div>
        </div>
        <div className="text-center p-3">
          <div className="text-3xl font-black font-mono text-orange-500 tabular-nums">4.8M+</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Passengers Served</div>
        </div>
        <div className="text-center p-3">
          <div className="text-3xl font-black font-mono text-white tabular-nums">99.4%</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">On-Time Departure Rate</div>
        </div>
      </div>

      {/* Pillars of Trust */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Zero Race-Condition Booking</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Our 10-minute pessimistic seat hold mechanism guarantees that once you select a sleeper berth, no other passenger can book it while you finalize checkout.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Verified Highway Telematics</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Real GPS coordinate streams track your coach along key expressway checkpoints, keeping you and your loved ones informed with realistic arrival estimates.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Transparent Refund Policy</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Self-service cancellation rules with clear time-window tiers (&gt;24h: 90% refund, 12-24h: 70%, 2-12h: 50%) credited back directly to your original payment method.
          </p>
        </div>
      </div>

      {/* Safety & Standards Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6">
        <h2 className="text-xl font-extrabold text-slate-900">
          Our Operator Quality & Safety Commitments
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Dual driver protocol for all overnight highway trips exceeding 6 hours.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Fresh sanitized blankets and sealed mineral water provided on all AC Sleepers.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Emergency exit windows and on-board fire suppression tested prior to each trip.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>24x7 Rapid Incident Support Center with real-time operator escalation.</span>
          </div>
        </div>
      </div>

      {/* Helpdesk & Contact Coordinates */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div>
          <div className="font-bold text-slate-900 text-sm">Need Help with an Existing Reservation?</div>
          <div className="text-slate-500 mt-0.5">Our passenger support helpline is available 24 hours a day, 7 days a week.</div>
        </div>
        <div className="flex flex-wrap items-center gap-4 shrink-0 font-medium text-slate-700">
          <div className="flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-orange-600" />
            <span className="font-mono font-bold">1800-BMB-TRAVEL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-orange-600" />
            <span>support@bmb.travel</span>
          </div>
        </div>
      </div>

    </div>
  );
};
