import React from 'react';
import { Bus, ShieldCheck, Phone, Mail } from 'lucide-react';

interface FooterProps {
  setCurrentTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentTab }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-slate-800">
          
          {/* Brand Col */}
          <div className="md:col-span-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold">
                <Bus className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-black tracking-tight text-white">BMB</span>
              <span className="text-[11px] font-semibold text-orange-400 uppercase">Book My Bus</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              India's leading intercity bus reservation platform featuring concurrency seat locks, verified test payments, and real-time highway telematics.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 space-y-2">
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              Navigation
            </div>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button onClick={() => setCurrentTab('home')} className="hover:text-white transition-colors cursor-pointer">
                  Search Buses
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('routes')} className="hover:text-white transition-colors cursor-pointer">
                  Popular Routes
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('live-tracking')} className="hover:text-white transition-colors cursor-pointer">
                  Live Highway Tracking
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('offers')} className="hover:text-white transition-colors cursor-pointer">
                  Discounts & Deals
                </button>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="md:col-span-3 space-y-2">
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              Assistance & Policy
            </div>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button onClick={() => setCurrentTab('about')} className="hover:text-white transition-colors cursor-pointer">
                  About Us & Fleet Safety
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('my-bookings')} className="hover:text-white transition-colors cursor-pointer">
                  Cancellation & Refund Rules
                </button>
              </li>
              <li className="text-slate-400">
                Helpline: <strong className="text-white font-mono">1800-BMB-TRAVEL</strong>
              </li>
              <li className="text-slate-400">
                Support: <strong className="text-white">support@bmb.travel</strong>
              </li>
            </ul>
          </div>

          {/* Security & Payments */}
          <div className="md:col-span-3 space-y-2">
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              Security & Payment
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              All transactions protected via 256-Bit SSL encryption and Razorpay test payment verification.
            </p>
            <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>PCI-DSS Compliant Gateway</span>
            </div>
          </div>

        </div>

        {/* Bottom Sub-bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <div>
            © {new Date().getFullYear()} BMB (Book My Bus) Technologies Pvt Ltd. All rights reserved.
          </div>
          <div className="flex gap-4">
            <span>Privacy Policy</span>
            <span>·</span>
            <span>Terms of Service</span>
            <span>·</span>
            <span>Passenger Charter</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
