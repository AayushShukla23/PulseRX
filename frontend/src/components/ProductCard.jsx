import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

export default function ProductCard({ medicine }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const id = medicine._id || medicine.id;

  const handleCardClick = () => {
    navigate(`/product/${id}`);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(medicine, 1);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col h-full hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] font-bold tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded uppercase">
          {medicine.dosage_form}
        </span>
        {medicine.prescription_required && (
          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200">
            Rx Required
          </span>
        )}
      </div>
      
      <h3 className="font-bold text-slate-900 text-sm leading-snug mb-1 group-hover:text-emerald-700 transition-colors line-clamp-2">
        {medicine.name}
      </h3>
      <p className="text-xs text-slate-500 mb-2">{medicine.pack_size}</p>
      
      <div className="mt-auto pt-4">
        <div className="mb-3">
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">Active Ingredient</p>
          <p className="text-xs text-slate-600 truncate" title={medicine.salt}>{medicine.salt}</p>
        </div>
        
        <div className="flex items-end justify-between pt-3 border-t border-slate-100">
          <div>
            <span className="text-[10px] text-slate-400 block mb-0.5">MRP</span>
            <span className="text-base font-black text-slate-900 leading-none">₹{medicine.price}</span>
          </div>
          <button 
            onClick={handleAddToCart}
            className="px-5 py-2 bg-white border border-emerald-600 text-emerald-700 font-bold text-xs rounded hover:bg-emerald-50 transition-colors"
          >
            ADD
          </button>
        </div>
      </div>
    </div>
  );
}