import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, WS_BASE_URL } from '../../services/api';
import { Check, Clock, Package, Truck, AlertCircle, MapPin, Shield } from '../../components/shared/Icons';

// Exact backend state mapping
const ORDER_STEPS = [
  { key: 'CREATED', label: 'Order Created', icon: Clock },
  { key: 'SEARCHING_FULFILLMENT', label: 'Searching Dark Store', icon: MapPin },
  { key: 'INVENTORY_RESERVED', label: 'Inventory Reserved', icon: Shield },
  { key: 'CONFIRMED', label: 'Order Confirmed', icon: Check },
  { key: 'PACKING', label: 'Packing Items', icon: Package },
  { key: 'READY_FOR_DISPATCH', label: 'Ready for Dispatch', icon: Package },
  { key: 'DISPATCHED', label: 'Out for Delivery', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: Check },
];

const FAILURE_STATES = ['CANCELLED', 'OUT_OF_STOCK', 'FULFILLMENT_FAILED', 'ALTERNATIVE_REVIEW'];

export default function TrackOrder() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsStatus, setWsStatus] = useState('connecting'); // 'connected' | 'connecting' | 'disconnected'
  
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  // 1. Initial Load via REST API
  const fetchOrder = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/orders/${id}`);
      if (!res.ok) throw new Error('Order not found');
      const data = await res.json();
      setOrder(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  // 2. WebSocket Connection & Event Stream
  useEffect(() => {
    fetchOrder();

    const connectWebSocket = () => {
      setWsStatus('connecting');
      const wsUrl = `${WS_BASE_URL}/orders/ws/${id}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.status) {
            setOrder((prev) => {
              if (!prev) return prev;
              
              // Append to history if new
              const newHistoryEntry = {
                status: payload.status,
                timestamp: payload.updated_at || new Date().toISOString(),
                note: payload.note || '',
              };

              return {
                ...prev,
                status: payload.status,
                store_id: payload.store_id || prev.store_id,
                updated_at: payload.updated_at || prev.updated_at,
                status_history: [...(prev.status_history || []), newHistoryEntry],
              };
            });
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message', err);
        }
      };

      ws.onerror = () => {
        setWsStatus('disconnected');
      };

      ws.onclose = () => {
        setWsStatus('disconnected');
        // Graceful reconnect after 3s if unmounted
        reconnectTimerRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-medium text-slate-500">Retrieving order status…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
        <h1 className="text-xl font-bold text-slate-900">Order Not Found</h1>
        <p className="text-sm text-slate-500">{error || 'Order ID invalid'}</p>
        <Link to="/" className="inline-block px-5 py-2 bg-slate-900 text-white font-bold text-sm rounded-lg">
          Return to Store
        </Link>
      </div>
    );
  }

  const isFailedState = FAILURE_STATES.includes(order.status);
  const currentStepIdx = ORDER_STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      
      {/* Order Header & WebSocket Live Status */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900">#{order._id}</h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                wsStatus === 'connected'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  wsStatus === 'connected' ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'
                }`}
              />
              {wsStatus === 'connected' ? 'LIVE WS' : 'RECONNECTING'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Placing for <span className="font-semibold text-slate-800">{order.customer_name}</span> ({order.customer_phone})
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Current Status</p>
          <p className="text-base font-black text-slate-900 mt-0.5">{order.status}</p>
        </div>
      </div>

      {/* Failure / Exception Banner */}
      {isFailedState && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 font-bold text-base">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            Order Update: {order.status}
          </div>
          <p className="text-sm text-rose-800">
            {order.status === 'ALTERNATIVE_REVIEW'
              ? 'The requested medicine is out of stock at nearby dark stores. A recommended substitution is required.'
              : 'This order encountered an operational exception and cannot be automatically fulfilled.'}
          </p>
        </div>
      )}

      {/* Live State Machine Stepper */}
      {!isFailedState && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Fulfillment Lifecycle</h2>

          <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {ORDER_STEPS.map((step, idx) => {
              const isPassed = currentStepIdx >= 0 && idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const Icon = step.icon;

              return (
                <div key={step.key} className="flex items-center gap-4 relative z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold transition-all ${
                      isCurrent
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-sm'
                        : isPassed
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                      {step.label}
                    </p>
                  </div>

                  {isCurrent && (
                    <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      ACTIVE
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Order & Store Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Delivery & Hub</h3>
          <div className="text-xs space-y-2 text-slate-600">
            <p><span className="text-slate-400">Address:</span> {order.customer_location?.address}</p>
            <p>
              <span className="text-slate-400">Fulfillment Hub:</span>{' '}
              <span className="font-bold text-slate-800">{order.store_id || 'Allocating nearby store…'}</span>
            </p>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Items Ordered</h3>
          <ul className="text-xs space-y-2 text-slate-700">
            {(order.items || []).map((item, idx) => (
              <li key={idx} className="flex justify-between">
                <span>{item.quantity}× {item.name}</span>
                <span className="font-bold">₹{item.total_price}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-slate-100 pt-2 flex justify-between text-xs font-bold text-slate-900">
            <span>Total Paid</span>
            <span>₹{order.total_amount}</span>
          </div>
        </section>
      </div>

      {/* Status History Audit Log */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">Status Transitions Audit Trail</h3>
        <div className="divide-y divide-slate-100 text-xs font-mono">
          {(order.status_history || []).map((h, idx) => (
            <div key={idx} className="py-2 flex justify-between items-center text-slate-600">
              <div>
                <span className="font-bold text-slate-900">{h.status}</span>
                {h.note && <span className="text-slate-400 ml-2 font-sans">({h.note})</span>}
              </div>
              <span className="text-slate-400">{new Date(h.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}