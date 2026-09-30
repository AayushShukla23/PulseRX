import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useLocation } from '../contexts/LocationContext';
import { useCart } from '../contexts/CartContext';
import SearchBox from '../components/SearchBox';
import { MapPin, ShoppingBag } from '../components/shared/Icons';

export default function CustomerLayout() {
  const { location } = useLocation();
  const { cartCount, cartTotal } = useCart();

  // Clean up the location label for consumer display (e.g., removing "Demo Location")
  const displayLocation = location.label.replace('Demo Location (', '').replace(')', '');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4 md:gap-8">
          
          {/* Logo & Location */}
          <div className="flex items-center gap-6 shrink-0">
            <Link to="/" className="font-black text-2xl text-emerald-700 tracking-tight">
              PulseRx
            </Link>
            
            <div className="hidden md:flex flex-col cursor-pointer group">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivering to</span>
              <div className="flex items-center gap-1 text-sm font-medium text-slate-700 group-hover:text-emerald-700 transition-colors">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate max-w-[200px]">{displayLocation}</span>
              </div>
            </div>
          </div>

          {/* Global Search - Hidden on small screens if we want a cleaner mobile header, but kept for desktop */}
          <div className="flex-1 hidden md:block max-w-2xl">
            <SearchBox />
          </div>

          {/* Cart */}
          <div className="shrink-0">
            <Link 
              to="/cart" 
              className="flex items-center gap-3 bg-white border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-lg transition-all"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-slate-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[10px] text-slate-500 font-bold uppercase leading-none">Cart</span>
                <span className="text-sm font-bold text-slate-900 leading-none mt-0.5">
                  {cartTotal > 0 ? `₹${cartTotal.toFixed(2)}` : 'Empty'}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
      
      <footer className="bg-white border-t border-slate-200 py-8 text-center mt-12">
        <p className="text-slate-400 text-sm">PulseRx Quick-Commerce Pharmacy</p>
        <Link to="/ops" className="text-emerald-700 text-xs font-medium hover:underline mt-2 inline-block">Operations Portal</Link>
      </footer>
    </div>
  );
}