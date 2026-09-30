import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';

// Matches backend VALID_TRANSITIONS graph in order_service.py 1:1
const VALID_TRANSITIONS = {
  CREATED: ['SEARCHING_FULFILLMENT', 'CANCELLED'],
  SEARCHING_FULFILLMENT: ['INVENTORY_RESERVED', 'ALTERNATIVE_REVIEW', 'OUT_OF_STOCK', 'FULFILLMENT_FAILED'],
  INVENTORY_RESERVED: ['CONFIRMED', 'CANCELLED'],
  ALTERNATIVE_REVIEW: ['CONFIRMED', 'CANCELLED', 'OUT_OF_STOCK'],
  CONFIRMED: ['PACKING', 'CANCELLED'],
  PACKING: ['READY_FOR_DISPATCH', 'CANCELLED'],
  READY_FOR_DISPATCH: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  OUT_OF_STOCK: [],
  FULFILLMENT_FAILED: [],
};

export default function OpsOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      const data = await api.listOrders();
      setOrders(data || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch orders list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleAdvanceStatus = async (orderId, nextStatus) => {
    setError(null);
    try {
      const updated = await api.advanceOrderStatus(orderId, nextStatus);
      if (updated?.detail) {
        throw new Error(updated.detail);
      }
      fetchOrders();
    } catch (err) {
      setError(`Transition failed: ${err.message || 'Illegal state transition'}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Fulfillment State Queue</h1>
          <p className="text-xs text-slate-400 mt-1">Advance order lifecycle phases to trigger WebSocket events.</p>
        </div>
        <button onClick={fetchOrders} className="px-3 py-1.5 bg-slate-800 text-xs font-bold text-slate-300 rounded hover:bg-slate-700">
          Refresh List
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/80 border border-rose-800 text-rose-300 rounded text-xs font-mono">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="text-slate-500 text-sm">Loading orders queue…</div>
      ) : orders.length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-slate-950 rounded border border-slate-800">
          No orders found in database. Place an order from the Customer Store.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => {
            const nextStates = VALID_TRANSITIONS[ord.status] || [];

            return (
              <div key={ord._id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-400">{ord._id}</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {ord.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Customer: <span className="text-white">{ord.customer_name}</span> ({ord.customer_phone}) • Store: <span className="text-slate-300">{ord.store_id || 'Unassigned'}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-white">₹{ord.total_amount}</p>
                    <a
                      href={`/track/${ord._id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-emerald-500 hover:underline inline-block mt-1"
                    >
                      Open Live Tracker ↗
                    </a>
                  </div>
                </div>

                {/* Items */}
                <div className="text-xs text-slate-400">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Items:</span>{' '}
                  {(ord.items || []).map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                </div>

                {/* Transitions Controls */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Valid Next Phase:</span>
                  {nextStates.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">Terminal State</span>
                  ) : (
                    nextStates.map((next) => (
                      <button
                        key={next}
                        onClick={() => handleAdvanceStatus(ord._id, next)}
                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                          next === 'CANCELLED' || next === 'OUT_OF_STOCK' || next === 'FULFILLMENT_FAILED'
                            ? 'bg-rose-950/60 text-rose-400 border border-rose-800 hover:bg-rose-900'
                            : 'bg-emerald-600 text-white hover:bg-emerald-500'
                        }`}
                      >
                        Advance to {next}
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}