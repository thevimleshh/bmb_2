import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bus, User as UserIcon, LogOut, Shield } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, openAuthModal }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => setCurrentTab('home')}
          className="flex items-center gap-2.5 text-left focus:outline-none shrink-0 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm group-hover:bg-orange-600 transition-colors">
            <Bus className="w-5 h-5 text-orange-500 group-hover:text-white transition-colors" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-slate-900 leading-none">
              BMB
            </div>
            <div className="text-[10px] font-semibold text-orange-600 tracking-wider uppercase">
              Book My Bus
            </div>
          </div>
        </button>

        {/* Zone 2: Navigation Links (Single-Line Clean Text Links) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => setCurrentTab('home')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              currentTab === 'home' ? 'text-orange-600 font-semibold border-b-2 border-orange-600' : 'hover:text-slate-900'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setCurrentTab('routes')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              currentTab === 'routes' ? 'text-orange-600 font-semibold border-b-2 border-orange-600' : 'hover:text-slate-900'
            }`}
          >
            Routes
          </button>
          <button
            onClick={() => setCurrentTab('live-tracking')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              currentTab === 'live-tracking' ? 'text-orange-600 font-semibold border-b-2 border-orange-600' : 'hover:text-slate-900'
            }`}
          >
            Live Location
          </button>
          <button
            onClick={() => setCurrentTab('offers')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              currentTab === 'offers' ? 'text-orange-600 font-semibold border-b-2 border-orange-600' : 'hover:text-slate-900'
            }`}
          >
            Offers
          </button>
          <button
            onClick={() => setCurrentTab('about')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              currentTab === 'about' ? 'text-orange-600 font-semibold border-b-2 border-orange-600' : 'hover:text-slate-900'
            }`}
          >
            About Us
          </button>
          <button
            onClick={() => setCurrentTab('my-bookings')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              currentTab === 'my-bookings' ? 'text-orange-600 font-semibold border-b-2 border-orange-600' : 'hover:text-slate-900'
            }`}
          >
            My Bookings
          </button>
          {isAdmin && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`whitespace-nowrap transition-colors py-1 flex items-center gap-1.5 cursor-pointer ${
                currentTab === 'admin' ? 'text-orange-600 font-semibold border-b-2 border-orange-600' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-orange-600" />
              <span>Admin Panel</span>
            </button>
          )}
        </nav>

        {/* Zone 3: 1 Primary Action (User profile or Login) */}
        <div className="flex items-center gap-3 shrink-0">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setCurrentTab('my-bookings')}
                title="View BMB Loyalty Points & Bookings"
                className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <span className="text-amber-600">⭐</span>
                <span className="font-mono tabular-nums">{user.loyaltyPoints ?? 280}</span>
                <span className="hidden sm:inline text-[10px] font-semibold text-amber-700">Pts</span>
              </button>

              <div className="hidden sm:block text-right">
                <div className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[130px]">
                  {user.name}
                </div>
                <div className="text-[11px] text-slate-500 truncate max-w-[130px]">
                  {user.email}
                </div>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-orange-600 rounded-lg transition-colors whitespace-nowrap shadow-sm cursor-pointer flex items-center gap-2"
            >
              <UserIcon className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
