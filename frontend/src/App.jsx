import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LocationProvider } from './contexts/LocationContext';
import { CartProvider } from './contexts/CartContext';

import CustomerLayout from './layouts/CustomerLayout';
import OpsLayout from './layouts/OpsLayout';

// Real Customer Pages
import Home from './pages/customer/Home';
import Search from './pages/customer/Search';
import ProductDetails from './pages/customer/ProductDetails'; 
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import TrackOrder from './pages/customer/TrackOrder';

// Real Ops Pages (Phase 5)
import OpsOverview from './pages/ops/OpsOverview';
import OpsOrders from './pages/ops/OpsOrders';
import OpsSystem from './pages/ops/OpsSystem';

export default function App() {
  return (
    <LocationProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Customer Flow */}
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/track/:id" element={<TrackOrder />} />
            </Route>

            {/* Operations Portal Flow */}
            <Route path="/ops" element={<OpsLayout />}>
              <Route index element={<OpsOverview />} />
              <Route path="orders" element={<OpsOrders />} />
              <Route path="system" element={<OpsSystem />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </LocationProvider>
  );
}