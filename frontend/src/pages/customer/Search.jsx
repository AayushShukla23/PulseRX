import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../../components/ProductCard';
import { api } from '../../services/api';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.searchMedicines(query, category);
        setResults(res.results || []);
        setTotal(res.total || 0);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch search results. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, category]);

  return (
    <div className="space-y-6">
      
      {/* Search Header */}
      <div className="pb-4 border-b border-slate-200">
        {query ? (
          <h1 className="text-2xl font-bold text-slate-900">
            Showing results for "{query}"
          </h1>
        ) : category ? (
          <h1 className="text-2xl font-bold text-slate-900">
            {category}
          </h1>
        ) : (
          <h1 className="text-2xl font-bold text-slate-900">All Products</h1>
        )}
        {!loading && !error && (
          <p className="text-sm text-slate-500 mt-2">{total} products found</p>
        )}
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
            <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-lg"></div>
          ))}
        </div>
      ) : error ? (
        <div className="p-12 text-center bg-white border border-rose-100 rounded-lg space-y-4 max-w-lg mx-auto mt-8">
          <p className="text-rose-700 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-slate-900 text-white rounded font-bold text-sm"
          >
            Retry Search
          </button>
        </div>
      ) : results.length === 0 ? (
        <div className="py-20 text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900">No products found</h2>
          <p className="text-sm text-slate-500">
            We couldn't find matches for "{query}". Try checking the spelling, or search for the generic salt name (e.g. Paracetamol).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {results.map(med => (
            <ProductCard key={med._id || med.id} medicine={med} />
          ))}
        </div>
      )}
    </div>
  );
}