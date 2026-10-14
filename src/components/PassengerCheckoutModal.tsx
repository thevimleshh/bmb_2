import React, { useState } from 'react';
import { Schedule, SeatItem, BoardingPoint, Passenger } from '../types';
import { useAuth } from '../context/AuthContext';
import { X, Tag, User, Mail, Phone, ArrowLeft, ShieldCheck, CheckCircle2, Sparkles, Coins } from 'lucide-react';

interface PassengerCheckoutModalProps {
  schedule: Schedule;
  selectedSeats: SeatItem[];
  boardingPoint: BoardingPoint;
  droppingPoint: BoardingPoint;
  totalAmount: number;
  initialEmail?: string;
  initialPhone?: string;
  onBack: () => void;
  onClose: () => void;
  onProceedToPayment: (data: {
    passengers: Passenger[];
    contactEmail: string;
    contactPhone: string;
    couponCode: string;
    discountAmount: number;
    redeemedPoints: number;
    pointsEarned: number;
    finalAmount: number;
  }) => void;
}

export const PassengerCheckoutModal: React.FC<PassengerCheckoutModalProps> = ({
  schedule,
  selectedSeats,
  boardingPoint,
  droppingPoint,
  totalAmount,
  initialEmail = 'rahul@example.com',
  initialPhone = '9898989898',
  onBack,
  onClose,
  onProceedToPayment,
}) => {
  const { user } = useAuth();
  const userLoyaltyPoints = user?.loyaltyPoints ?? 280;

  // Initialize passengers for each selected seat
  const [passengers, setPassengers] = useState<Passenger[]>(() =>
    selectedSeats.map((seat, index) => ({
      seatNumber: seat.seatNumber,
      name: index === 0 ? (user?.name || 'Rahul Sharma') : '',
      age: index === 0 ? 29 : 25,
      gender: 'MALE',
    }))
  );

  const [contactEmail, setContactEmail] = useState(initialEmail);
  const [contactPhone, setContactPhone] = useState(initialPhone);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; description: string } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Loyalty Points Redemption State
  const maxRedeemablePoints = Math.min(userLoyaltyPoints, Math.floor(totalAmount * 0.5)); // Up to 50% of base fare
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState<boolean>(false);
  const [redeemedPoints, setRedeemedPoints] = useState<number>(maxRedeemablePoints);

  const updatePassenger = (index: number, field: keyof Passenger, value: any) => {
    setPassengers(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch('/api/offers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, totalAmount }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setCouponError(data.message || 'Invalid promotional coupon code');
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({ code: data.code, discount: data.discount, description: data.description });
        setCouponError(null);
      }
    } catch {
      setCouponError('Failed to validate promo code');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const pointsDiscount = useLoyaltyPoints ? Math.min(redeemedPoints, maxRedeemablePoints) : 0;
  const totalDiscount = couponDiscount + pointsDiscount;
  
  const discountedBase = Math.max(0, totalAmount - totalDiscount);
  const gstAmount = Math.round(discountedBase * 0.05);
  const finalAmount = discountedBase + gstAmount;

  // Reward points earned on cash portion (5%)
  const pointsEarned = Math.max(10, Math.floor(finalAmount * 0.05));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate email & phone
    if (!contactEmail.includes('@') || !contactPhone || contactPhone.length < 10) {
      setFormError('Please enter a valid email address and 10-digit mobile number.');
      return;
    }

    // Validate passenger names
    for (const p of passengers) {
      if (!p.name.trim()) {
        setFormError(`Please enter passenger name for seat ${p.seatNumber}`);
        return;
      }
      if (!p.age || p.age < 1 || p.age > 120) {
        setFormError(`Please enter a valid age for seat ${p.seatNumber}`);
        return;
      }
    }

    onProceedToPayment({
      passengers,
      contactEmail,
      contactPhone,
      couponCode: appliedCoupon ? appliedCoupon.code : '',
      discountAmount: totalDiscount,
      redeemedPoints: pointsDiscount,
      pointsEarned,
      finalAmount,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Back to Seat Selection"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                Step 2 of 3 · Passenger Details & Loyalty Rewards
              </div>
              <h3 className="text-lg font-black tracking-tight text-white">
                Passenger & Booking Details
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Form: Passenger Inputs (Col 7) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Journey Summary Chip */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="flex justify-between items-center font-bold text-slate-900 mb-2">
                <span>{schedule.fromCity} → {schedule.toCity}</span>
                <span className="font-mono text-orange-600 font-bold">{schedule.departureTime}</span>
              </div>
              <div className="text-slate-500 space-y-1">
                <div><strong className="text-slate-700">Boarding:</strong> {boardingPoint.locationName} ({boardingPoint.time})</div>
                <div><strong className="text-slate-700">Dropping:</strong> {droppingPoint.locationName} ({droppingPoint.time})</div>
              </div>
            </div>

            {/* Passenger Rows */}
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Passenger Information</span>
                <span className="text-orange-600 font-mono font-bold">{passengers.length} Seat(s)</span>
              </div>

              {passengers.map((p, idx) => (
                <div key={p.seatNumber} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800">
                      Passenger #{idx + 1}
                    </span>
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded font-mono text-xs font-bold">
                      Seat {p.seatNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Full Name (as on Govt ID)
                      </label>
                      <input
                        type="text"
                        required
                        value={p.name}
                        onChange={e => updatePassenger(idx, 'name', e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Age
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        required
                        value={p.age}
                        onChange={e => updatePassenger(idx, 'age', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Gender
                      </label>
                      <select
                        value={p.gender}
                        onChange={e => updatePassenger(idx, 'gender', e.target.value as any)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Details */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Ticket Delivery Details
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Email Address (for PDF e-ticket)
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Mobile Number (for SMS & WhatsApp PNR)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={e => setContactPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Rail: Loyalty Points, Promo Coupons & Fare Breakdown (Col 5) */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            
            <div className="space-y-4">
              
              {/* BMB Loyalty Points Redemption Card */}
              <div className="p-4 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white rounded-xl border border-amber-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <Coins className="w-4 h-4 text-amber-600" />
                    <span>Redeem BMB Loyalty Points</span>
                  </div>
                  <span className="font-mono font-black text-amber-800 text-xs bg-amber-100 px-2 py-0.5 rounded">
                    {userLoyaltyPoints} Pts Avail.
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 mb-3">
                  1 BMB Point = ₹1.00 instant ticket discount. Redeem up to 50% of base fare.
                </div>

                {userLoyaltyPoints > 0 ? (
                  <div className="space-y-2.5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={useLoyaltyPoints}
                        onChange={e => {
                          setUseLoyaltyPoints(e.target.checked);
                          if (e.target.checked && redeemedPoints === 0) {
                            setRedeemedPoints(maxRedeemablePoints);
                          }
                        }}
                        className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 accent-orange-600"
                      />
                      <span>Apply Points Discount (-₹{useLoyaltyPoints ? redeemedPoints : maxRedeemablePoints})</span>
                    </label>

                    {useLoyaltyPoints && (
                      <div className="pt-2">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                          <span>Points to Redeem:</span>
                          <span className="font-mono text-amber-700 font-bold">{redeemedPoints} Pts (₹{redeemedPoints})</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max={maxRedeemablePoints}
                          step="10"
                          value={redeemedPoints}
                          onChange={e => setRedeemedPoints(Number(e.target.value))}
                          className="w-full accent-orange-600 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic">
                    You currently have 0 points. Complete this trip to earn your first loyalty reward!
                  </div>
                )}

                {/* Reward points preview on this trip */}
                <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center justify-between text-[11px] font-bold text-amber-900">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Points Earned on this Trip:</span>
                  </span>
                  <span className="font-mono text-emerald-700 font-bold">+{pointsEarned} Points</span>
                </div>
              </div>

              {/* Promo Coupon Module */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-orange-600" />
                  <span>Have a Promo Coupon?</span>
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. BMBFIRST"
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono uppercase focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  />
                  <button
                    type="button"
                    disabled={validatingCoupon}
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    {validatingCoupon ? 'Checking...' : 'Apply'}
                  </button>
                </div>

                {appliedCoupon && (
                  <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>Coupon <strong>{appliedCoupon.code}</strong> applied! Saved ₹{appliedCoupon.discount}.</span>
                  </div>
                )}

                {couponError && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                    {couponError}
                  </div>
                )}

                {/* Popular coupon suggestions */}
                <div className="mt-3 pt-2 border-t border-slate-200 flex flex-wrap gap-1 text-[11px]">
                  <span className="text-slate-400">Available:</span>
                  {['BMBFIRST', 'JOURNEY20', 'FESTIVE100'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCouponCode(c)}
                      className="text-orange-600 font-mono font-bold hover:underline cursor-pointer"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2.5 text-xs">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Fare Summary
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Base Ticket Fare ({passengers.length} seat):</span>
                  <span className="font-mono tabular-nums font-semibold">₹{totalAmount}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon Discount:</span>
                    <span className="font-mono tabular-nums">-₹{couponDiscount}</span>
                  </div>
                )}

                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-amber-700 font-semibold">
                    <span>Loyalty Points Redeemed ({pointsDiscount} pts):</span>
                    <span className="font-mono tabular-nums">-₹{pointsDiscount}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Taxes & GST (5%):</span>
                  <span className="font-mono tabular-nums font-semibold">₹{gstAmount}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-bold text-sm text-slate-900">
                  <span>Net Payable Amount:</span>
                  <span className="text-2xl font-black text-orange-600 font-mono tabular-nums">
                    ₹{finalAmount}
                  </span>
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
                  {formError}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-2">
              <button
                type="submit"
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Proceed to Razorpay Test Payment (₹{finalAmount}) →</span>
              </button>
              <div className="text-[11px] text-center text-slate-400">
                Locked seats are held for 10 minutes while completing checkout.
              </div>
            </div>

          </div>

        </form>

      </div>
    </div>
  );
};
