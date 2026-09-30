import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useCart } from '../../contexts/CartContext';
import { useLocation } from '../../contexts/LocationContext';
import { AlertCircle, MapPin, Package, Shield, Check, Plus, Minus, Info } from '../../components/shared/Icons';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { location } = useLocation();
  const { cartItems, addToCart, updateQuantity } = useCart();
  
  const [medicine, setMedicine] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [fulfillment, setFulfillment] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if item is in cart to display quantity controls
  const cartItem = cartItems.find(item => item.id === id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      setError(null);
      window.scrollTo(0, 0); // Reset scroll on navigation

      try {
        // 1. Fetch Source of Truth Medicine Data
        const medData = await api.getMedicine(id);
        setMedicine(medData);

        // 2. Fetch Substitutions & Fulfillment simultaneously
        const [altsData, fulfillData] = await Promise.all([
          api.getAlternatives(id),
          api.checkFulfillment(location.lng, location.lat, id, 1)
        ]);
        
        setAlternatives(altsData.alternatives || []);
        setFulfillment(fulfillData);

      } catch (err) {
        console.error(err);
        setError("Medicine not found or unavailable.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id, location.lng, location.lat]);

  const handleAdd = () => {
    if (medicine) addToCart(medicine, 1);
  };

  const handleSubstituteAdd = (altMed) => {
    addToCart(altMed, 1);
  };

  if (loading) return <ProductSkeleton />;
  
  if (error) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Product Not Found</h2>
        <p className="text-sm text-slate-500">{error}</p>
        <button onClick={() => navigate('/')} className="text-emerald-700 font-bold text-sm mt-4 hover:underline">
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-start relative">
      
      {/* LEFT COLUMN - Product Information */}
      <div className="flex-1 w-full space-y-8">
        
        {/* Breadcrumbs */}
        <nav className="text-xs font-medium text-slate-500 flex gap-2 items-center">
          <button onClick={() => navigate('/')} className="hover:text-slate-900">Home</button>
          <span>/</span>
          <button onClick={() => navigate(`/search?category=${encodeURIComponent(medicine.category)}`)} className="hover:text-slate-900">
            {medicine.category}
          </button>
          <span>/</span>
          <span className="text-slate-900 truncate">{medicine.name}</span>
        </nav>

        {/* Basic Info Header */}
        <section className="space-y-4 border-b border-slate-200 pb-8">
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="text-xs font-bold tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded uppercase">
              {medicine.dosage_form}
            </span>
            {medicine.prescription_required && (
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Rx Required
              </span>
            )}
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {medicine.name}
          </h1>
          
          <p className="text-lg text-slate-600 font-medium">By {medicine.brand}</p>
          <p className="text-sm text-slate-500">{medicine.pack_size}</p>
        </section>

        {/* Medicine Composition / Specs */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Medicine Information</h2>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              <div className="p-4 space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Ingredient</p>
                <p className="text-sm font-semibold text-slate-900">{medicine.salt}</p>
              </div>
              <div className="p-4 space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Strength</p>
                <p className="text-sm font-semibold text-slate-900">{medicine.strength}</p>
              </div>
              <div className="p-4 space-y-1 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Route of Administration</p>
                <p className="text-sm font-semibold text-slate-900">{medicine.route}</p>
              </div>
              <div className="p-4 space-y-1 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Manufacturer</p>
                <p className="text-sm font-semibold text-slate-900">{medicine.manufacturer}</p>
              </div>
            </div>
          </div>
          {medicine.description && (
            <p className="text-sm text-slate-600 leading-relaxed mt-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
              {medicine.description}
            </p>
          )}
        </section>

        {/* PulseRx Substitution Engine */}
        {/* PulseRx Substitution Candidates */}
{alternatives.length > 0 && (
  <section className="space-y-4 pt-4">
    <div>
      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
        <Shield className="w-5 h-5 text-emerald-600" />
        Related medicines / substitution candidates
      </h2>
      <p className="text-sm text-slate-500 mt-1">
        Candidates returned by the substitution engine based on structured attributes
        (active ingredient, strength, dosage form, route). These are not automatic medical substitutions.
      </p>
    </div>

    <div className="space-y-3">
      {alternatives.map((alt, idx) => {
        const hasMismatch =
          alt.warnings?.length > 0 ||
          !alt.matched_attributes?.includes('strength') ||
          !alt.matched_attributes?.includes('dosage_form');

        return (
          <div
            key={idx}
            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-emerald-500/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-slate-900">{alt.candidate_medicine.name}</h3>
                {typeof alt.alternative_score === 'number' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    Score {(alt.alternative_score * 100).toFixed(0)}%
                  </span>
                )}
                {hasMismatch && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                    Attribute mismatch
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                By {alt.candidate_medicine.brand} • {alt.candidate_medicine.pack_size} •{' '}
                {alt.candidate_medicine.strength} • {alt.candidate_medicine.dosage_form}
              </p>

              <div className="flex flex-wrap gap-2 mt-3">
                {(alt.matched_attributes || []).map((attr) => (
                  <span
                    key={attr}
                    className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-100"
                  >
                    Matched: {attr.replace('_', ' ')}
                  </span>
                ))}
              </div>

              {(alt.warnings || []).length > 0 && (
                <div className="mt-2 text-xs text-amber-800 bg-amber-50 px-2 py-1.5 rounded border border-amber-200">
                  <span className="font-bold">Mismatch / warning:</span> {alt.warnings.join(' • ')}
                </div>
              )}

              {alt.requires_approval && (
                <p className="mt-2 text-[11px] text-slate-500">
                  Requires explicit user/pharmacist confirmation. Not auto-substituted.
                </p>
              )}
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
              <p className="font-black text-slate-900 text-lg">₹{alt.candidate_medicine.price}</p>
              <button
                onClick={() => handleSubstituteAdd(alt.candidate_medicine)}
                className="px-4 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold text-xs rounded transition-colors"
              >
                ADD CANDIDATE
              </button>
            </div>
          </div>
        );
      })}
    </div>

    <p className="text-[10px] text-slate-400 mt-2 flex items-start gap-1">
      <Info className="w-3 h-3 shrink-0" />
      Engineering simulation only. Matching is attribute-based (salt/strength/form/route). No clinical equivalence is claimed.
    </p>
  </section>
)}
      </div>

      {/* RIGHT COLUMN - Sticky Purchase Panel */}
      <div className="w-full lg:w-[380px] shrink-0 sticky top-24">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-6 space-y-6">
          
          {/* Price Block */}
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">MRP Total</p>
            <p className="text-4xl font-black text-slate-900">₹{medicine.price}</p>
            <p className="text-xs text-slate-500 mt-1">Inclusive of all taxes</p>
          </div>

          <hr className="border-slate-100" />

          {/* Fulfillment Status (Live Backend Data) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Fulfillment Status</h3>
            {fulfillment === null ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 animate-pulse">
                Checking availability nearby...
              </div>
            ) : fulfillment.fulfillable ? (
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 space-y-2">
                <div className="flex items-start gap-2 text-emerald-800">
                  <Check className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-bold">Available for Delivery</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-700/80 ml-7">
                  <Package className="w-3.5 h-3.5" />
                  <span>Dispatched from {fulfillment.fulfillment_store.store_name}</span>
                </div>
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 space-y-2">
                <div className="flex items-start gap-2 text-rose-800">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-bold">Currently Unavailable</span>
                </div>
                <p className="text-xs text-rose-700/80 ml-7">
                  Out of stock at nearby fulfillment hubs. Please check alternatives.
                </p>
              </div>
            )}
          </div>

          {/* Prescription Warning inside purchase panel */}
          {medicine.prescription_required && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-start gap-2">
              <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>Valid prescription required. You will be asked to upload it during checkout.</p>
            </div>
          )}

          {/* Cart Interaction */}
          <div className="pt-2">
            {!fulfillment?.fulfillable ? (
              <button disabled className="w-full py-3.5 bg-slate-100 text-slate-400 font-bold rounded-xl cursor-not-allowed">
                Out of Stock
              </button>
            ) : quantityInCart === 0 ? (
              <button 
                onClick={handleAdd}
                className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-colors shadow-md shadow-emerald-700/20"
              >
                Add to Cart
              </button>
            ) : (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2 rounded-xl">
                <button 
                  onClick={() => updateQuantity(medicine._id || medicine.id, quantityInCart - 1)}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-black text-emerald-900">{quantityInCart} in Cart</span>
                <button 
                  onClick={() => updateQuantity(medicine._id || medicine.id, quantityInCart + 1)}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-start animate-pulse">
      <div className="flex-1 w-full space-y-8">
        <div className="h-4 bg-slate-200 rounded w-48 mb-8"></div>
        <div className="space-y-4">
          <div className="h-6 bg-slate-200 rounded w-24"></div>
          <div className="h-10 bg-slate-200 rounded w-3/4"></div>
          <div className="h-6 bg-slate-200 rounded w-48"></div>
        </div>
        <div className="h-48 bg-slate-200 rounded-xl w-full"></div>
      </div>
      <div className="w-full lg:w-[380px] h-96 bg-slate-200 rounded-2xl shrink-0"></div>
    </div>
  );
}