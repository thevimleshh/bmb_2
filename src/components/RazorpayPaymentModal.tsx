import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, Smartphone, Building2, Wallet, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';

interface RazorpayPaymentModalProps {
  amount: number;
  customerEmail: string;
  customerPhone: string;
  onSuccess: (paymentDetails: {
    paymentId: string;
    orderId: string;
    signature: string;
  }) => void;
  onFailure: (errorMsg: string) => void;
  onClose: () => void;
}

export const RazorpayPaymentModal: React.FC<RazorpayPaymentModalProps> = ({
  amount,
  customerEmail,
  customerPhone,
  onSuccess,
  onFailure,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'UPI' | 'CARD' | 'NETBANKING' | 'WALLET'>('UPI');
  const [upiId, setUpiId] = useState('rahul@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [processing, setProcessing] = useState(false);

  const simulateSuccess = () => {
    setProcessing(true);
    setTimeout(() => {
      const paymentId = 'pay_test_' + Math.random().toString(36).substring(2, 12);
      const orderId = 'order_test_' + Math.random().toString(36).substring(2, 12);
      const signature = 'rzp_test_success';

      setProcessing(false);
      onSuccess({ paymentId, orderId, signature });
    }, 1200);
  };

  const simulateFailure = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onFailure('Payment failed: Card was declined or bank server timeout in test sandbox.');
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Razorpay Brand Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black text-sm">
              ₹
            </div>
            <div>
              <div className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3" /> Razorpay Test Sandbox
              </div>
              <div className="text-base font-extrabold text-white">
                BMB - Book My Bus
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Banner */}
        <div className="bg-slate-50 px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">Payable Total (Including GST)</div>
            <div className="text-xs text-slate-700 font-mono mt-0.5">{customerEmail} · {customerPhone}</div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
            ₹{amount}
          </div>
        </div>

        {/* Payment Methods Tabs */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('UPI')}
              className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'UPI' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4 text-orange-600" />
              <span>UPI</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('CARD')}
              className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'CARD' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4 text-orange-600" />
              <span>Card</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('NETBANKING')}
              className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'NETBANKING' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4 text-orange-600" />
              <span>NetBanking</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('WALLET')}
              className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'WALLET' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wallet className="w-4 h-4 text-orange-600" />
              <span>Wallet</span>
            </button>
          </div>

          {/* Tab 1: UPI */}
          {activeTab === 'UPI' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700">Quick UPI Options (Simulated)</div>
              <div className="grid grid-cols-3 gap-2">
                {['Google Pay', 'PhonePe', 'Paytm'].map(app => (
                  <button
                    key={app}
                    type="button"
                    onClick={() => setUpiId(`traveler@${app.toLowerCase().replace(' ', '')}`)}
                    className="p-2.5 bg-slate-50 border border-slate-200 hover:border-orange-500 rounded-xl text-xs font-semibold text-slate-800 text-center transition-colors cursor-pointer"
                  >
                    {app}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Or enter Virtual Payment Address (VPA / UPI ID)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  placeholder="username@okhdfcbank"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Cards */}
          {activeTab === 'CARD' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700">Test Debit / Credit Card</div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={e => setCardNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Expiry (MM/YY)
                  </label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={e => setCardExpiry(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    CVV
                  </label>
                  <input
                    type="password"
                    maxLength={3}
                    value={cardCvv}
                    onChange={e => setCardCvv(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: NetBanking */}
          {activeTab === 'NETBANKING' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700">Select Bank</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map(bank => (
                  <button
                    key={bank}
                    type="button"
                    onClick={() => setSelectedBank(bank)}
                    className={`p-2.5 rounded-xl border text-left font-medium transition-colors cursor-pointer ${
                      selectedBank === bank ? 'border-orange-500 bg-orange-50 font-bold text-orange-950' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    {bank}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Wallets */}
          {activeTab === 'WALLET' && (
            <div className="space-y-2 text-xs">
              {['Amazon Pay', 'Paytm Wallet', 'PhonePe Wallet', 'MobiKwik'].map(wallet => (
                <div key={wallet} className="p-3 border border-slate-200 rounded-xl flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{wallet}</span>
                  <span className="text-[11px] text-emerald-600 font-bold">Available</span>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 space-y-2.5">
            <button
              type="button"
              disabled={processing}
              onClick={simulateSuccess}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{processing ? 'Verifying with Bank...' : `Pay ₹${amount} (Test Success)`}</span>
            </button>

            <button
              type="button"
              disabled={processing}
              onClick={simulateFailure}
              className="w-full py-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span>Simulate Payment Decline / Failure</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>256-Bit SSL Encrypted · Razorpay Test Verification</span>
          </div>

        </div>

      </div>
    </div>
  );
};
