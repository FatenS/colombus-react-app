
//OrderService.js
import axiosInstance from "./AxiosInstance";   // ← adjust relative path if needed

// ────────────────────────────── Orders ─────────────────────────

// Submit order (client)
export const submitOrder = (orderData) =>
  axiosInstance.post("/orders", orderData);

// Fetch orders (client or admin)
export const fetchOrders = (isAdmin) =>
  axiosInstance.get(isAdmin ? "/admin/api/orders" : "/orders");

// Delete order (client)
export const deleteOrder = (orderId) =>
  axiosInstance.delete(`/orders/${orderId}`);

// Update order (client)
export const updateOrderClient = (orderId, updatedData) =>
  axiosInstance.put(`/orders/${orderId}`, updatedData);

// ───────────────────────── Admin-only endpoints ────────────────

// Fetch matched orders
export const fetchMatchedOrders = () =>
  axiosInstance.get("/admin/matched_orders");

// Fetch market orders
export const fetchMarketOrders = () =>
  axiosInstance.get("/admin/market_orders");

// Update order (admin panel)
export const updateOrder = (orderId, updatedData) =>
  axiosInstance.put(`/admin/api/orders/${orderId}`, updatedData);

// Kick off matching process
export const runMatching = () =>
  axiosInstance.post("/admin/run_matching");

// ─────────────────────── Bulk Excel upload ─────────────────────

// Upload orders in bulk (Excel)
export const uploadOrders = (formData) =>
  axiosInstance.post("/upload-orders", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ─────────────────────── Premium-rate CRUD ─────────────────────

export const fetchPremiumRates = () =>
  axiosInstance.get("/admin/api/premium-rate");

export const createPremiumRate = (rateData) =>
  axiosInstance.post("/admin/api/premium-rate", rateData);

export const updatePremiumRate = (rateId, rateData) =>
  axiosInstance.put(`/admin/api/premium-rate/${rateId}`, rateData);

export const deletePremiumRate = (rateId) =>
  axiosInstance.delete(`/admin/api/premium-rate/${rateId}`);