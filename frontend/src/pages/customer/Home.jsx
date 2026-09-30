import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../../components/ProductCard';
import SearchBox from '../../components/SearchBox';
import { api } from '../../services/api';

const CATEGORIES = [
  { name: 'Pain & Fever', desc: 'Relief & reduction' },
  { name: 'Pediatrics', desc: 'Child health' },
  { name: 'Gastro Care', desc: 'Digestive health' },
  { name: 'Allergy & Cold', desc: 'Immunity & care' },
  { name: 'Antibiotics', desc: 'Infection treatment' },
  { name: 'Respiratory', desc: 'Breathing support' }
];

export default function Home() {
  const navigate = useNavigate();
  const [popularMedicines, setPopularMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await api.getMedicines(10); 
        setPopularMedicines(res);
      } catch (err) {
        console.error("Failed to load catalog", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  return (
    <div className="space-y-12">
      
      {/* Commerce Hero Section */}
      <section className="bg-slate-900 rounded-xl p-8 md:p-12 text-center text-white space-y-6">
        <div className="space-y-2 max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Medicines & essentials, delivered.
          </h1>
          <p className="text-slate-400 text-sm md:text-base">
            Search from thousands of medicines and get them delivered from your nearest pharmacy hub.
          </p>
        </div>
        
        {/* Mobile Search Box (Visible here on all screens to act as primary CTA) */}
        <div className="max-w-2xl mx-auto text-left">
          <SearchBox />
        </div>
      </section>

      {/* Prescription Entry Point */}
      <section className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Order with Prescription</h2>
          <p className="text-sm text-slate-600 mt-1">Upload your prescription and we will arrange the medicines for you.</p>
        </div>
        <button 
          disabled
          className="px-6 py-2.5 bg-emerald-700 text-white text-sm font-bold rounded opacity-50 cursor-not-allowed shrink-0"
          title="This feature is coming soon"
        >
          Upload (Coming Soon)
        </button>
      </section>

      {/* Category Navigation */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Shop by Category</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map(cat => (
            <button 
              key={cat.name}
              onClick={() => navigate(`/search?category=${encodeURIComponent(cat.name)}`)}
              className="p-4 bg-white border border-slate-200 rounded-lg text-left hover:border-emerald-600 hover:shadow-sm transition-all group"
            >
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700">{cat.name}</h3>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide">{cat.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Popular Products */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Frequently Ordered</h2>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-lg"></div>)}
          </div>
        ) : popularMedicines.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-lg text-slate-500">
            No products available at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {popularMedicines.map(med => (
              <ProductCard key={med._id || med.id} medicine={med} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}