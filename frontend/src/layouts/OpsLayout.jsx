import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function OpsLayout() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex">
      <aside className="w-64 border-r border-slate-800 p-4 space-y-4">
        <h2 className="font-bold text-white text-lg mb-8">Ops Portal</h2>
        <nav className="flex flex-col space-y-2 text-sm">
          <Link to="/ops" className="hover:text-white">Overview</Link>
          <Link to="/ops/orders" className="hover:text-white">Active Orders</Link>
          <Link to="/ops/system" className="hover:text-white">System Health</Link>
          <Link to="/" className="text-emerald-500 mt-8 block hover:underline">← Exit to Store</Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}