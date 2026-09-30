import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

export default function OpsOverview() {
  const [orders, setOrders] = useState([]);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    Promise.all([api.listOrders(), api.getHealth()])
      .then(([o, h]) => {
        setOrders(o || []);
        setHealth(h);
      })
      .catch(() => {});
  }, []);

  const totalOrders = orders.length;
  const activeOrders = orders.filter((o) => !['DELIVERED', 'CANCELLED', 'OUT_OF_STOCK', 'FULFILLMENT_FAILED'].includes(o.status)).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Operations Command Center</h1>
        <p className="text-xs text-slate-400 mt-1">Real-time quick-commerce dark store fulfillment metrics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Queue</p>
          <p className="text-3xl font-black text-emerald-400">{activeOrders}</p>
        </div>
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Orders Logged</p>
          <p className="text-3xl font-black text-white">{totalOrders}</p>
        </div>
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Infrastructure Health</p>
          <p className="text-3xl font-black text-emerald-400">
            {health?.status === 'healthy' ? 'ONLINE' : 'DEGRADED'}
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <Link to="/ops/orders" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded">
          Manage Orders Queue →
        </Link>
        <Link to="/ops/system" className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded">
          System Health Probes →
        </Link>
      </div>
    </div>
  );
}