import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Search, ArrowRight } from './shared/Icons';

const POPULAR_SEARCHES = ['Paracetamol', 'Crocin', 'Pantoprazole', 'Ibuprofen', 'Cough Syrup'];

export default function SearchBox() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    
    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const res = await api.searchMedicines(query);
        setSuggestions(res.results.slice(0, 5) || []);
      } catch (e) {
        console.error("Autocomplete error", e);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 250);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setIsFocused(false);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSuggestionClick = (med) => {
    setIsFocused(false);
    setQuery('');
    navigate(`/product/${med._id || med.id}`);
  };

  const handlePopularClick = (term) => {
    setIsFocused(false);
    setQuery(term);
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <div className="relative w-full z-40" ref={wrapperRef}>
      <form onSubmit={handleSearchSubmit} className="relative flex items-center">
        <div className="absolute left-3 text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search for medicines, health products, or active ingredients..."
          className="w-full pl-10 pr-20 py-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all placeholder:text-slate-400"
        />
        <button 
          type="submit" 
          className="absolute right-2 px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded hover:bg-slate-800 transition-colors"
        >
          Search
        </button>
      </form>

      {isFocused && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {query.trim().length < 2 ? (
            <div className="p-4 bg-slate-50">
              <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Popular Searches</h4>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map(term => (
                  <button 
                    key={term}
                    onClick={() => handlePopularClick(term)}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-slate-600 text-sm rounded transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-2">
              {loading ? (
                <div className="p-4 text-sm text-slate-500 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  Searching...
                </div>
              ) : suggestions.length > 0 ? (
                <ul>
                  {suggestions.map(med => (
                    <li key={med._id || med.id}>
                      <button 
                        onMouseDown={() => handleSuggestionClick(med)}
                        className="w-full text-left px-4 py-3 hover:bg-emerald-50 flex items-center justify-between group border-b border-slate-100 last:border-0 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-800">{med.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{med.dosage_form} • {med.pack_size}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600" />
                      </button>
                    </li>
                  ))}
                  <li>
                    <button 
                      onMouseDown={handleSearchSubmit}
                      className="w-full text-left px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-slate-50 bg-slate-50/50 border-t border-slate-100"
                    >
                      See all results for "{query}"
                    </button>
                  </li>
                </ul>
              ) : (
                <div className="p-4 text-sm text-slate-500">No products found for "{query}".</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}