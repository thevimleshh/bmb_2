import React, { useState } from 'react';
import { Tag, Check, Copy, Percent, Sparkles, ShieldCheck } from 'lucide-react';

interface OffersViewProps {
  onApplyOffer?: (code: string) => void;
}

export const OffersView: React.FC<OffersViewProps> = ({ onApplyOffer }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const offers = [
    {
      code: 'BMBFIRST',
      title: 'First Journey Special',
      discount: '15% Instant Off',
      subtitle: 'Maximum discount up to ₹250 on your maiden reservation.',
      minBooking: '₹400',
      validity: 'Valid across all AC Sleeper and Volvo routes',
      highlight: true,
    },
    {
      code: 'JOURNEY20',
      title: 'Long Route Corridor Discount',
      discount: 'Flat ₹200 OFF',
      subtitle: 'Save flat ₹200 on intercity highway journeys exceeding 300 km.',
      minBooking: '₹800',
      validity: 'Valid on Bangalore-Chennai, Hyderabad-Bangalore & Mumbai-Goa',
      highlight: false,
    },
    {
      code: 'FESTIVE100',
      title: 'Festive Season Rush Savings',
      discount: 'Flat ₹100 OFF',
      subtitle: 'Instant discount on weekend getaways and family travel.',
      minBooking: '₹500',
      validity: 'Valid across all participating private and state fleets',
      highlight: false,
    },
  ];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
    if (onApplyOffer) onApplyOffer(code);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div className="text-center max-w-2xl mx-auto">
        <div className="text-orange-600 font-bold text-xs uppercase tracking-wider mb-2">
          Exclusive Travel Deals & Promo Codes
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Save More on Every Highway Journey
        </h1>
        <p className="text-xs text-slate-500 mt-2">
          Apply these verified coupon codes directly during passenger checkout for instant fare deductions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {offers.map(offer => (
          <div
            key={offer.code}
            className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
              offer.highlight
                ? 'bg-slate-900 text-white border-slate-900 shadow-xl'
                : 'bg-white text-slate-900 border-slate-200 shadow-xs hover:shadow-md'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    offer.highlight ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700'
                  }`}
                >
                  {offer.title}
                </span>
                <Tag className={`w-4 h-4 ${offer.highlight ? 'text-orange-400' : 'text-slate-400'}`} />
              </div>

              <div>
                <div className={`text-2xl font-black font-mono tracking-tight ${offer.highlight ? 'text-white' : 'text-slate-900'}`}>
                  {offer.discount}
                </div>
                <p className={`text-xs mt-1 ${offer.highlight ? 'text-slate-300' : 'text-slate-500'}`}>
                  {offer.subtitle}
                </p>
              </div>

              <div className={`text-xs space-y-1 pt-3 border-t ${offer.highlight ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                <div><strong>Min. Booking:</strong> {offer.minBooking}</div>
                <div><strong>Terms:</strong> {offer.validity}</div>
              </div>
            </div>

            {/* Copy Coupon Action */}
            <div className="pt-6">
              <div
                className={`flex items-center justify-between p-2 rounded-xl border ${
                  offer.highlight ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="font-mono font-black text-sm tracking-widest px-2">
                  {offer.code}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(offer.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    copiedCode === offer.code
                      ? 'bg-emerald-600 text-white'
                      : offer.highlight
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {copiedCode === offer.code ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
