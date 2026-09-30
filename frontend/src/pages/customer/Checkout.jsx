import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useLocation } from '../../contexts/LocationContext';
import { api } from '../../services/api';
import { AlertCircle } from '../../components/shared/Icons';

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { location } = useLocation();

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    address: '',
  });
  const [rxAcknowledged, setRxAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const hasRxItems = useMemo(
    () => cartItems.some((item) => item.prescription_required),
    [cartItems]
  );

  if (cartItems.length === 0) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Nothing to checkout</h1>
        <p className="text-sm text-slate-500">Your cart is empty.</p>
        <Link to="/" className="text-emerald-700 font-bold text-sm hover:underline">
          Go to store
        </Link>
      </div>
    );
  }

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    if (!form.customer_name.trim()) return 'Customer name is required.';
    if (!form.customer_phone.trim()) return 'Phone number is required.';
    if (!/^[+\d][\d\s-]{7,15}$/.test(form.customer_phone.trim())) {
      return 'Enter a valid phone number.';
    }
    if (!form.address.trim() || form.address.trim().length < 8) {
      return 'Enter a complete delivery address.';
    }
    if (hasRxItems && !rxAcknowledged) {
      return 'Acknowledge the prescription requirement to continue.';
    }
    return null;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    const payload = {
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim(),
      location: {
        lng: location.lng,
        lat: location.lat,
        address: form.address.trim(),
      },
      items: cartItems.map((item) => ({
        medicine_id: item.id,
        quantity: item.quantity,
      })),
    };

    try {
      // Re-check first item availability before submit (backend currently fulfills primarily on first item)
      for (const item of cartItems) {
        const check = await api.checkFulfillment(
          location.lng,
          location.lat,
          item.id,
          item.quantity
        );
        if (!check.fulfillable) {
          throw new Error(
            `Inventory unavailable for ${item.name}. ${check.reason || 'Please update your cart and try again.'}`
          );
        }
      }

      const order = await api.createOrder(payload);

      if (!order || !order._id) {
        const detail = order?.detail;
        throw new Error(
          typeof detail === 'string'
            ? detail
            : 'Order creation failed. No order ID returned.'
        );
      }

      // Success: clear cart and go to real order route
      clearCart();
      navigate(`/track/${order._id}`, { replace: true, state: { order } });
    } catch (err) {
      const message =
        err?.message ||
        'Order could not be created. Inventory may have changed, or the server rejected the request.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <form onSubmit={handlePlaceOrder} className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
          <p className="text-sm text-slate-500 mt-1">
            Enter delivery details. Payment gateway is not implemented in this demo.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg px-4 py-3 text-sm flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Could not place order</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h2 className="font-bold text-slate-900">Customer details</h2>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Full name
            </label>
            <input
              type="text"
              value={form.customer_name}
              onChange={(e) => updateField('customer_name', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="e.g. Rahul Sharma"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              value={form.customer_phone}
              onChange={(e) => updateField('customer_phone', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="+91 98765 43210"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Delivery address
            </label>
            <textarea
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="House/flat, street, landmark"
              required
            />
            <p className="text-xs text-slate-500 mt-2">
              Fulfillment coordinates from location context: {location.lat.toFixed(4)}, {location.lng.toFixed(4)} ({location.label})
            </p>
          </div>
        </section>

        {hasRxItems && (
          <section className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
            <h2 className="font-bold text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Prescription required
            </h2>
            <p className="text-sm text-amber-900/90">
              One or more items in your cart require a valid prescription. Prescription upload and pharmacist verification are <strong>not implemented</strong> in this demo backend.
            </p>
            <label className="flex items-start gap-2 text-sm text-amber-950 cursor-pointer">
              <input
                type="checkbox"
                checked={rxAcknowledged}
                onChange={(e) => setRxAcknowledged(e.target.checked)}
                className="mt-1"
              />
              <span>
                I understand this is a simulation and no prescription verification will be performed. In a real pharmacy product, ordering would be blocked until a valid prescription is verified.
              </span>
            </label>
          </section>
        )}

        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <h2 className="font-bold text-slate-900">Payment</h2>
          <p className="text-sm text-slate-600">
            Payment processing is <strong>out of scope</strong> for this demo. No charge will be made.
          </p>
          <div className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700">
            Method: Pay on delivery (simulated, not processed)
          </div>
        </section>

        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto px-8 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold rounded-lg transition-colors"
        >
          {submitting ? 'Placing order…' : 'Place order'}
        </button>
      </form>

      <aside className="lg:col-span-1">
        <div className="bg-white border border-slate-200 rounded-xl p-5 sticky top-24 space-y-4">
          <h2 className="font-bold text-slate-900">Order summary</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">{item.name}</p>
                  <p className="text-xs text-slate-500">Qty {item.quantity}</p>
                </div>
                <p className="font-medium text-slate-900 shrink-0">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-slate-900">
            <span>Total</span>
            <span>₹{cartTotal.toFixed(2)}</span>
          </div>
          <Link to="/cart" className="text-sm text-emerald-700 hover:underline">
            ← Back to cart
          </Link>
        </div>
      </aside>
    </div>
  );
}