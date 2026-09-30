import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useLocation } from '../../contexts/LocationContext';
import { api } from '../../services/api';
import { Plus, Minus, AlertCircle, ShoppingBag } from '../../components/shared/Icons';

export default function Cart() {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, cartTotal, cartCount } = useCart();
  const { location } = useLocation();

  const [validating, setValidating] = useState(false);
  const [validationIssues, setValidationIssues] = useState([]);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const validateAvailability = async () => {
      if (cartItems.length === 0) {
        setValidationIssues([]);
        setValidationError(null);
        return;
      }

      setValidating(true);
      setValidationError(null);

      try {
        const checks = await Promise.all(
          cartItems.map(async (item) => {
            try {
              const res = await api.checkFulfillment(
                location.lng,
                location.lat,
                item.id,
                item.quantity
              );
              return {
                id: item.id,
                name: item.name,
                fulfillable: !!res.fulfillable,
                reason: res.reason || null,
                store: res.fulfillment_store || null,
              };
            } catch {
              return {
                id: item.id,
                name: item.name,
                fulfillable: false,
                reason: 'Could not verify inventory for this item.',
                store: null,
              };
            }
          })
        );

        if (!cancelled) {
          setValidationIssues(checks.filter((c) => !c.fulfillable));
        }
      } catch (err) {
        if (!cancelled) {
          setValidationError('Unable to validate cart availability right now.');
        }
      } finally {
        if (!cancelled) setValidating(false);
      }
    };

    validateAvailability();
    return () => {
      cancelled = true;
    };
  }, [cartItems, location.lat, location.lng]);

  const canCheckout = cartItems.length > 0 && validationIssues.length === 0 && !validating && !validationError;

  if (cartItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8 text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Your cart is empty</h1>
        <p className="text-sm text-slate-500">Add medicines from search or product pages to continue.</p>
        <Link
          to="/"
          className="inline-block mt-2 px-6 py-3 bg-emerald-700 text-white font-bold rounded-lg hover:bg-emerald-800"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cart</h1>
          <p className="text-sm text-slate-500 mt-1">{cartCount} item{cartCount === 1 ? '' : 's'}</p>
        </div>

        {validating && (
          <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
            Checking nearby inventory availability…
          </div>
        )}

        {validationError && (
          <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {validationError}
          </div>
        )}

        {validationIssues.length > 0 && (
          <div className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 space-y-2">
            <div className="font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Some items cannot be fulfilled right now
            </div>
            <ul className="list-disc pl-5 space-y-1">
              {validationIssues.map((issue) => (
                <li key={issue.id}>
                  <span className="font-medium">{issue.name}</span>
                  {issue.reason ? ` — ${issue.reason}` : ' — insufficient nearby stock'}
                </li>
              ))}
            </ul>
            <p className="text-xs text-amber-800">
              Reduce quantity, remove unavailable items, or choose a substitution candidate from the product page.
            </p>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {cartItems.map((item) => {
            const issue = validationIssues.find((v) => v.id === item.id);
            const lineTotal = item.price * item.quantity;

            return (
              <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.id}`} className="font-bold text-slate-900 hover:text-emerald-700">
                    {item.name}
                  </Link>
                  <p className="text-xs text-slate-500 mt-1">
                    {item.dosage_form} • {item.pack_size}
                  </p>
                  <p className="text-sm text-slate-700 mt-2">₹{item.price} each</p>
                  {issue && (
                    <p className="text-xs text-rose-700 mt-2 font-medium">Unavailable for current quantity/location</p>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center rounded hover:bg-white"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded hover:bg-white"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-right min-w-[80px]">
                    <p className="font-bold text-slate-900">₹{lineTotal.toFixed(2)}</p>
                    <button
                      onClick={() => updateQuantity(item.id, 0)}
                      className="text-xs text-slate-500 hover:text-rose-600 mt-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Link to="/" className="inline-block text-sm font-medium text-emerald-700 hover:underline">
          ← Continue shopping
        </Link>
      </div>

      <aside className="lg:col-span-1">
        <div className="bg-white border border-slate-200 rounded-xl p-5 sticky top-24 space-y-4">
          <h2 className="font-bold text-slate-900">Order summary</h2>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span>₹{cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Delivery fee</span>
            <span className="text-emerald-700 font-medium">Calculated at hub</span>
          </div>
          <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-slate-900">
            <span>Total</span>
            <span>₹{cartTotal.toFixed(2)}</span>
          </div>

          <button
            disabled={!canCheckout}
            onClick={() => navigate('/checkout')}
            className="w-full py-3 bg-emerald-700 text-white font-bold rounded-lg hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            {validating ? 'Validating…' : 'Proceed to checkout'}
          </button>

          {!canCheckout && cartItems.length > 0 && !validating && (
            <p className="text-xs text-slate-500">
              Resolve availability issues before checkout.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}