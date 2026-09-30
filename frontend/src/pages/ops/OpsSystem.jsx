import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function OpsSystem() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch (e) {
      setHealth({ status: 'unhealthy' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">System Infrastructure Probes</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time health latencies reported by GET /health/dependencies</p>
        </div>
        <button onClick={fetchHealth} className="px-3 py-1.5 bg-slate-800 text-xs font-bold text-slate-300 rounded hover:bg-slate-700">
          Probe Now
        </button>
      </div>

      {loading && !health ? (
        <div className="text-slate-500 text-sm">Probing backends…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* MongoDB */}
          <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-sm">MongoDB</h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                health?.dependencies?.mongodb?.status === 'healthy' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400'
              }`}>
                {health?.dependencies?.mongodb?.status || 'UNKNOWN'}
              </span>
            </div>
            <p className="text-2xl font-mono font-bold text-white">
              {health?.dependencies?.mongodb?.latency_ms ?? '--'} <span className="text-xs text-slate-500">ms</span>
            </p>
            <p className="text-xs text-slate-500">Source of truth, 2dsphere geospatial indexes & atomic conditional reservations.</p>
          </div>

          {/* Redis */}
          <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-sm">Redis</h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                health?.dependencies?.redis?.status === 'healthy' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400'
              }`}>
                {health?.dependencies?.redis?.status || 'UNKNOWN'}
              </span>
            </div>
            <p className="text-2xl font-mono font-bold text-white">
              {health?.dependencies?.redis?.latency_ms ?? '--'} <span className="text-xs text-slate-500">ms</span>
            </p>
            <p className="text-xs text-slate-500">Distributed locks key manager & WebSocket event pub/sub connection gateway.</p>
          </div>

          {/* Elasticsearch */}
          <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-sm">Elasticsearch</h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                health?.dependencies?.elasticsearch?.status === 'healthy' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400'
              }`}>
                {health?.dependencies?.elasticsearch?.status || 'UNKNOWN'}
              </span>
            </div>
            <p className="text-2xl font-mono font-bold text-white">
              {health?.dependencies?.elasticsearch?.latency_ms ?? '--'} <span className="text-xs text-slate-500">ms</span>
            </p>
            <p className="text-xs text-slate-500">Cluster Status: {health?.dependencies?.elasticsearch?.cluster_status || 'N/A'}. Custom edge-ngram full text search.</p>
          </div>
        </div>
      )}
    </div>
  );
}