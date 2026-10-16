
import React, { useState, useEffect, useCallback } from 'react';
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

const API_BASE_URL = 'https://bmb-22.onrender.com';

function AppContent() {
  const { user } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('home');

  // Search parameters
  const [fromCity, setFromCity] = useState<string>('Mumbai');
  const [toCity, setToCity] = useState<string>('Pune');
  const [journeyDate, setJourneyDate] = useState<string>(
    () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  );
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loadingBuses, setLoadingBuses] = useState<boolean>(false);

  // Active modal targets
  const [activeSeatModalSchedule, setActiveSeatModalSchedule] =
    useState<Schedule | null>(null);

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

  const [ticketSuccessBooking, setTicketSuccessBooking] =
    useState<Booking | null>(null);

  const [cancellationBooking, setCancellationBooking] =
    useState<Booking | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  // Live tracking target
  const [trackingScheduleId, setTrackingScheduleId] = useState<number>(1);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const showToast = useCallback(
    (text: string, type: 'success' | 'error' = 'success') => {
      setToastMessage({ text, type });
      window.setTimeout(() => {
        setToastMessage(current =>
          current?.text === text ? null : current
        );
      }, 4000);
    },
    []
  );

  // Unique session ID for seat-lock tracking
  const [sessionId] = useState<string>(() => {
    try {
      let sid = sessionStorage.getItem('bmb_session_id');

      if (!sid) {
        sid =
          'session_' +
          Math.random().toString(36).substring(2, 12);

        sessionStorage.setItem('bmb_session_id', sid);
      }

      return sid;
    } catch {
      return (
        'session_' +
        Math.random().toString(36).substring(2, 12)
      );
    }
  });

  // Search buses from the deployed Spring Boot backend
  const handleSearchBuses = useCallback(async () => {
    if (!fromCity.trim() || !toCity.trim() || !journeyDate) {
      showToast('Please select starting city, destination and date.', 'error');
      return;
    }

    if (
      fromCity.trim().toLowerCase() ===
      toCity.trim().toLowerCase()
    ) {
      showToast('Starting city and destination cannot be the same.', 'error');
      return;
    }

    setLoadingBuses(true);
    setCurrentTab('home');

    try {
      const params = new URLSearchParams({
        from: fromCity.trim(),
        to: toCity.trim(),
        date: journeyDate,
      });

      const response = await fetch(
        `${API_BASE_URL}/api/buses/search?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(
          `Bus search failed (${response.status}). ${errorText.slice(0, 180)}`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Backend returned an unexpected bus-search response.');
      }

      setSchedules(data);

      if (data.length === 0) {
        showToast('No buses found for this route and date.', 'error');
      }
    } catch (error) {
      console.error('BMB bus search error:', error);
      setSchedules([]);

      const message =
        error instanceof Error ? error.message : 'Unknown network error';

      showToast(
        `Unable to load buses. ${message}. Check backend status and CORS settings.`,
        'error'
      );
    } finally {
      setLoadingBuses(false);
    }
  }, [fromCity, toCity, journeyDate, showToast]);

  // Initial bus search
  useEffect(() => {
    void handleSearchBuses();
  }, []); // Intentionally run once when the app first loads.

  const handleSelectSeats = (schedule: Schedule) => {
    setActiveSeatModalSchedule(schedule);
  };

  const handleTrackBus = (scheduleId: number) => {
    setTrackingScheduleId(scheduleId);
    setCurrentTab('live-tracking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Seat selection -> passenger details
  const handleProceedToPassengerDetails = (data: {
    selectedSeats: SeatItem[];
    boardingPoint: BoardingPoint;
    droppingPoint: BoardingPoint;
    totalAmount: number;
    lockExpiresAt: number;
  }) => {
    setPassengerModalData(data);
  };

  // Passenger details -> payment
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

  // Verify payment and confirm booking on the backend
  const handlePaymentSuccess = async (paymentDetails: {
    paymentId: string;
    orderId: string;
    signature: string;
  }) => {
    if (
      !activeSeatModalSchedule ||
      !passengerModalData ||
      !razorpayModalData
    ) {
      showToast('Booking details are missing. Please try again.', 'error');
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/bookings/verify-and-confirm`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            scheduleId: activeSeatModalSchedule.id,
            boardingPoint:
              `${passengerModalData.boardingPoint.locationName} ` +
              `(${passengerModalData.boardingPoint.time})`,
            droppingPoint:
              `${passengerModalData.droppingPoint.locationName} ` +
              `(${passengerModalData.droppingPoint.time})`,
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
        }
      );

      const responseText = await response.text();
      let data: any = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          `Backend returned an invalid response (${response.status}).`
        );
      }

      if (!response.ok) {
        showToast(
          data.error ||
            data.message ||
            `Payment verification failed (${response.status}).`,
          'error'
        );
        return;
      }

      if (!data.booking) {
        showToast(
          'Server did not return a confirmed booking. Please verify booking status.',
          'error'
        );
        return;
      }

      setRazorpayModalData(null);
      setPassengerModalData(null);
      setActiveSeatModalSchedule(null);
      setTicketSuccessBooking(data.booking);

      showToast(
        data.pnr
          ? `Booking confirmed! PNR: ${data.pnr}`
          : 'Booking confirmed successfully!'
      );

      void handleSearchBuses();
    } catch (error) {
      console.error('BMB payment verification error:', error);

      showToast(
        error instanceof Error
          ? error.message
          : 'Network error verifying booking confirmation.',
        'error'
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-orange-500 selection:text-white">

      {/* Toast notification */}
      {toastMessage && (
        <div
          role="status"
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 ${
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
          <button
            type="button"
            aria-label="Dismiss notification"
            className="ml-2"
            onClick={() => setToastMessage(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openAuthModal={() => setAuthModalOpen(true)}
      />

      {/* Main views */}
      <main className="flex-1">
        {(currentTab === 'home' || currentTab === 'routes') && (
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

            {loadingBuses && (
              <div className="text-center py-4 text-slate-500" role="status">
                Searching for buses...
              </div>
            )}
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
              showToast(`Coupon code ${code} selected.`);
            }}
          />
        )}

        {currentTab === 'about' && <AboutUsView />}

        {currentTab === 'my-bookings' && (
          <MyBookingsView
            onTrackBus={handleTrackBus}
            onOpenCancellationModal={booking =>
              setCancellationBooking(booking)
            }
            onNavigateHome={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Seat selection */}
      {activeSeatModalSchedule && !passengerModalData && (
        <SeatMapModal
          schedule={activeSeatModalSchedule}
          sessionId={sessionId}
          onClose={() => setActiveSeatModalSchedule(null)}
          onProceedToPassengerDetails={handleProceedToPassengerDetails}
        />
      )}

      {/* Passenger details */}
      {activeSeatModalSchedule &&
        passengerModalData &&
        !razorpayModalData && (
          <PassengerCheckoutModal
            schedule={activeSeatModalSchedule}
            selectedSeats={passengerModalData.selectedSeats}
            boardingPoint={passengerModalData.boardingPoint}
            droppingPoint={passengerModalData.droppingPoint}
            totalAmount={passengerModalData.totalAmount}
            initialEmail={user?.email || ''}
            initialPhone={user?.phone || ''}
            onBack={() => setPassengerModalData(null)}
            onClose={() => {
              setActiveSeatModalSchedule(null);
              setPassengerModalData(null);
            }}
            onProceedToPayment={handleProceedToPayment}
          />
        )}

      {/* Razorpay payment */}
      {razorpayModalData && (
        <RazorpayPaymentModal
          amount={razorpayModalData.finalAmount}
          customerEmail={razorpayModalData.customerEmail}
          customerPhone={razorpayModalData.customerPhone}
          onSuccess={handlePaymentSuccess}
          onFailure={error => showToast(error, 'error')}
          onClose={() => setRazorpayModalData(null)}
        />
      )}

      {/* Booking confirmation */}
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

      {/* Cancellation */}
      {cancellationBooking && (
        <CancellationModal
          booking={cancellationBooking}
          onClose={() => setCancellationBooking(null)}
          onCancellationSuccess={() => {
            setCancellationBooking(null);
            showToast('Ticket cancelled. Please check refund status.');
            void handleSearchBuses();
          }}
        />
      )}

      {/* Authentication */}
      {authModalOpen && (
        <AuthModal onClose={() => setAuthModalOpen(false)} />
      )}

      {/* Footer */}
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
