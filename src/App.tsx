import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { HeroSearch } from './components/HeroSearch';
import { BusResults } from './components/BusResults';
import { SeatMapModal } from './components/SeatMapModal';
import { PassengerCheckoutModal } from './components/PassengerCheckoutModal';
import { RazorpayPaymentModal } from './components/RazorpayPaymentModal';
import { TicketSuccessModal } from './components/TicketSuccessModal';
import { MyBookingsView } from './components/MyBookingsView';
import { CancellationModal } from './components/CancellationModal';
import { LiveTrackingView } from './components/LiveTrackingView';
import { OffersView } from './components/OffersView';
import { AboutUsView } from './components/AboutUsView';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { Schedule, SeatItem, BoardingPoint, Passenger, Booking } from './types';
import { CheckCircle2, AlertCircle } from 'lucide-react';

function AppContent() {
  const { user, updateLoyaltyPoints } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');

  // Search parameters
  const [fromCity, setFromCity] = useState<string>('Mumbai');
  const [toCity, setToCity] = useState<string>('Pune');
  const [journeyDate, setJourneyDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loadingBuses, setLoadingBuses] = useState<boolean>(false);

  // Active modal targets
  const [activeSeatModalSchedule, setActiveSeatModalSchedule] = useState<Schedule | null>(null);
  const [passengerModalData, setPassengerModalData] = useState<{
    selectedSeats: SeatItem[];
    boardingPoint: BoardingPoint;
    droppingPoint: BoardingPoint;
    totalAmount: number;
    lockExpiresAt: number;
  } | null>(null);

  const [razorpayModalData, setRazorpayModalData] = useState<{
    amount: number;
    customerEmail: string;
    customerPhone: string;
    passengers: Passenger[];
    couponCode: string;
    discountAmount: number;
    redeemedPoints: number;
    pointsEarned: number;
    finalAmount: number;
  } | null>(null);

  const [ticketSuccessBooking, setTicketSuccessBooking] = useState<Booking | null>(null);
  const [cancellationBooking, setCancellationBooking] = useState<Booking | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  // Live tracking target
  const [trackingScheduleId, setTrackingScheduleId] = useState<number>(1);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Unique session ID for concurrency hold tracking
  const [sessionId] = useState<string>(() => {
    let sid = sessionStorage.getItem('bmb_session_id');
    if (!sid) {
      sid = 'session_' + Math.random().toString(36).substring(2, 12);
      sessionStorage.setItem('bmb_session_id', sid);
    }
    return sid;
  });

  // Fetch buses matching search criteria
  const handleSearchBuses = async () => {
    setLoadingBuses(true);
    setCurrentTab('home');
    try {
      const res = await fetch(`/api/buses/search?from=${encodeURIComponent(fromCity)}&to=${encodeURIComponent(toCity)}&date=${journeyDate}`);
      const data = await res.json();
      setSchedules(data || []);
      setLoadingBuses(false);
    } catch {
      showToast('Error searching buses. Please check connection.', 'error');
      setLoadingBuses(false);
    }
  };

  // Initial load
  useEffect(() => {
    handleSearchBuses();
  }, []);

  const handleSelectSeats = (schedule: Schedule) => {
    setActiveSeatModalSchedule(schedule);
  };

  const handleTrackBus = (scheduleId: number) => {
    setTrackingScheduleId(scheduleId);
    setCurrentTab('live-tracking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Transition from Seat Selection to Passenger Form
  const handleProceedToPassengerDetails = (data: {
    selectedSeats: SeatItem[];
    boardingPoint: BoardingPoint;
    droppingPoint: BoardingPoint;
    totalAmount: number;
    lockExpiresAt: number;
  }) => {
    setPassengerModalData(data);
  };

  // Transition from Passenger Form to Razorpay Payment
  const handleProceedToPayment = (data: {
    passengers: Passenger[];
    contactEmail: string;
    contactPhone: string;
    couponCode: string;
    discountAmount: number;
    redeemedPoints: number;
    pointsEarned: number;
    finalAmount: number;
  }) => {
    setRazorpayModalData({
      amount: data.finalAmount,
      customerEmail: data.contactEmail,
      customerPhone: data.contactPhone,
      passengers: data.passengers,
      couponCode: data.couponCode,
      discountAmount: data.discountAmount,
      redeemedPoints: data.redeemedPoints,
      pointsEarned: data.pointsEarned,
      finalAmount: data.finalAmount,
    });
  };

  // Final verification with backend after payment success
  const handlePaymentSuccess = async (paymentDetails: {
    paymentId: string;
    orderId: string;
    signature: string;
  }) => {
    if (!activeSeatModalSchedule || !passengerModalData || !razorpayModalData) return;

    try {
      const res = await fetch('/api/bookings/verify-and-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: activeSeatModalSchedule.id,
          boardingPoint: `${passengerModalData.boardingPoint.locationName} (${passengerModalData.boardingPoint.time})`,
          droppingPoint: `${passengerModalData.droppingPoint.locationName} (${passengerModalData.droppingPoint.time})`,
          passengers: razorpayModalData.passengers,
          couponCode: razorpayModalData.couponCode,
          paymentId: paymentDetails.paymentId,
          orderId: paymentDetails.orderId,
          signature: paymentDetails.signature,
          sessionId,
          userEmail: razorpayModalData.customerEmail,
          userName: razorpayModalData.passengers[0]?.name,
          userPhone: razorpayModalData.customerPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Payment verification failed on server', 'error');
        setRazorpayModalData(null);
        return;
      }

      // Close intermediate modals and show confirmed ticket
      setRazorpayModalData(null);
      setPassengerModalData(null);
      setActiveSeatModalSchedule(null);
      setTicketSuccessBooking(data.booking);
      showToast('Booking Confirmed! E-Ticket generated with PNR: ' + data.pnr);
      handleSearchBuses(); // Refresh seat counts
    } catch {
      showToast('Network error verifying booking confirmation', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-orange-500 selection:text-white">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Global Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openAuthModal={() => setAuthModalOpen(true)}
      />

      {/* View Routing */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <div>
            <HeroSearch
              fromCity={fromCity}
              setFromCity={setFromCity}
              toCity={toCity}
              setToCity={setToCity}
              journeyDate={journeyDate}
              setJourneyDate={setJourneyDate}
              passengerCount={passengerCount}
              setPassengerCount={setPassengerCount}
              onSearch={handleSearchBuses}
            />

            <BusResults
              schedules={schedules}
              fromCity={fromCity}
              toCity={toCity}
              journeyDate={journeyDate}
              onSelectSeats={handleSelectSeats}
              onTrackBus={handleTrackBus}
            />
          </div>
        )}

        {currentTab === 'routes' && (
          <div>
            <HeroSearch
              fromCity={fromCity}
              setFromCity={setFromCity}
              toCity={toCity}
              setToCity={setToCity}
              journeyDate={journeyDate}
              setJourneyDate={setJourneyDate}
              passengerCount={passengerCount}
              setPassengerCount={setPassengerCount}
              onSearch={handleSearchBuses}
            />
            <BusResults
              schedules={schedules}
              fromCity={fromCity}
              toCity={toCity}
              journeyDate={journeyDate}
              onSelectSeats={handleSelectSeats}
              onTrackBus={handleTrackBus}
            />
          </div>
        )}

        {currentTab === 'live-tracking' && (
          <LiveTrackingView
            scheduleId={trackingScheduleId}
            onNavigateHome={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'offers' && (
          <OffersView
            onApplyOffer={code => {
              showToast(`Coupon code ${code} copied!`);
            }}
          />
        )}

        {currentTab === 'about' && <AboutUsView />}

        {currentTab === 'my-bookings' && (
          <MyBookingsView
            onTrackBus={handleTrackBus}
            onOpenCancellationModal={booking => setCancellationBooking(booking)}
            onNavigateHome={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Modal 1: Interactive 2D Seat Selection */}
      {activeSeatModalSchedule && !passengerModalData && (
        <SeatMapModal
          schedule={activeSeatModalSchedule}
          sessionId={sessionId}
          onClose={() => setActiveSeatModalSchedule(null)}
          onProceedToPassengerDetails={handleProceedToPassengerDetails}
        />
      )}

      {/* Modal 2: Passenger Details & Coupon Form */}
      {activeSeatModalSchedule && passengerModalData && !razorpayModalData && (
        <PassengerCheckoutModal
          schedule={activeSeatModalSchedule}
          selectedSeats={passengerModalData.selectedSeats}
          boardingPoint={passengerModalData.boardingPoint}
          droppingPoint={passengerModalData.droppingPoint}
          totalAmount={passengerModalData.totalAmount}
          initialEmail={user?.email || 'rahul@example.com'}
          initialPhone={user?.phone || '9898989898'}
          onBack={() => setPassengerModalData(null)}
          onClose={() => {
            setActiveSeatModalSchedule(null);
            setPassengerModalData(null);
          }}
          onProceedToPayment={handleProceedToPayment}
        />
      )}

      {/* Modal 3: Razorpay Test Payment Modal */}
      {razorpayModalData && (
        <RazorpayPaymentModal
          amount={razorpayModalData.finalAmount}
          customerEmail={razorpayModalData.customerEmail}
          customerPhone={razorpayModalData.customerPhone}
          onSuccess={handlePaymentSuccess}
          onFailure={err => showToast(err, 'error')}
          onClose={() => setRazorpayModalData(null)}
        />
      )}

      {/* Modal 4: Confirmed E-Ticket & Vector PDF Download */}
      {ticketSuccessBooking && (
        <TicketSuccessModal
          booking={ticketSuccessBooking}
          onClose={() => setTicketSuccessBooking(null)}
          onTrackBus={handleTrackBus}
          onViewMyBookings={() => {
            setTicketSuccessBooking(null);
            setCurrentTab('my-bookings');
          }}
        />
      )}

      {/* Modal 5: Cancellation & Refund Engine */}
      {cancellationBooking && (
        <CancellationModal
          booking={cancellationBooking}
          onClose={() => setCancellationBooking(null)}
          onCancellationSuccess={() => {
            setCancellationBooking(null);
            showToast('Ticket cancelled. Refund initiated.');
            handleSearchBuses();
          }}
        />
      )}

      {/* Modal 6: Auth Modal (Login / Register) */}
      {authModalOpen && (
        <AuthModal onClose={() => setAuthModalOpen(false)} />
      )}

      {/* Global Footer */}
      <Footer setCurrentTab={setCurrentTab} />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
