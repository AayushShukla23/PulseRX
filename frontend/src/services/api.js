const API_BASE_URL = 'http://localhost:8000/api/v1';
export const WS_BASE_URL = 'ws://localhost:8000/api/v1';

export const api = {
  getHealth: async () => {
    const res = await fetch(`${API_BASE_URL}/health/dependencies`);
    return res.json();
  },

  getMedicines: async (limit = 20) => {
    const res = await fetch(`${API_BASE_URL}/medicines?limit=${limit}`);
    return res.json();
  },

  searchMedicines: async (query, category) => {
    let url = `${API_BASE_URL}/search/medicines?q=${encodeURIComponent(query || '')}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Search API failed");
    return res.json();
  },

  getAlternatives: async (medicineId) => {
    const res = await fetch(`${API_BASE_URL}/alternatives/${medicineId}`);
    if (!res.ok) return { alternatives: [] };
    return res.json();
  },

  getNearbyStores: async (lng, lat) => {
    if (lng === undefined || lat === undefined) throw new Error("Location coordinates required");
    const res = await fetch(`${API_BASE_URL}/stores/nearby?lng=${lng}&lat=${lat}`);
    return res.json();
  },

  // NEW: Fulfillment Check Endpoint
  checkFulfillment: async (lng, lat, medicineId, quantity = 1) => {
    if (!lng || !lat || !medicineId) throw new Error("Missing parameters for fulfillment check");
    const res = await fetch(`${API_BASE_URL}/stores/fulfillment-check?lng=${lng}&lat=${lat}&medicine_id=${medicineId}&quantity=${quantity}`);
    return res.json();
  },

  createOrder: async (orderPayload) => {
  const res = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.detail;
    throw new Error(
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => d.msg || JSON.stringify(d)).join(', ')
          : 'Order creation failed'
    );
  }
  return data;
},

  listOrders: async () => {
    const res = await fetch(`${API_BASE_URL}/orders`);
    return res.json();
  },

  advanceOrderStatus: async (orderId, nextStatus) => {
    const res = await fetch(
      `${API_BASE_URL}/orders/${orderId}/advance-status?next_status=${nextStatus}`,
      { method: 'POST' }
    );
    return res.json();
  },

  getMedicine: async (medicineId) => {
    const res = await fetch(`${API_BASE_URL}/medicines/${medicineId}`);
    if (!res.ok) throw new Error("Medicine not found");
    return res.json();
  },
};