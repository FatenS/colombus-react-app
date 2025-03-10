
//OrderService.js

import axios from 'axios';

const API_URL = 'http://localhost:5001';

// Submit order (client)
export const submitOrder = (orderData) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        throw new Error('Token not available');
    }

    return axios.post(`${API_URL}/orders`, orderData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
    });
};

// Fetch orders (client or admin)
export const fetchOrders = (isAdmin) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        throw new Error('Token not available');
    }

    const endpoint = isAdmin ? '/admin/api/orders' : '/orders';
    return axios.get(`${API_URL}${endpoint}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

// Fetch matched orders (admin only)
export const fetchMatchedOrders = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        throw new Error('Token not available');
    }

    return axios.get(`${API_URL}/admin/matched_orders`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

// Run matching process (admin only)
export const runMatching = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        throw new Error('Token not available');
    }

    return axios.post(`${API_URL}/admin/run_matching`, {}, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

// Update order (admin)
export const updateOrder = (orderId, updatedData) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        throw new Error('Token not available');
    }

    return axios.put(`http://localhost:5001/admin/api/orders/${orderId}`, updatedData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
};

// Fetch market orders (admin only)
export const fetchMarketOrders = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        throw new Error('Token not available');
    }

    return axios.get(`${API_URL}/admin/market_orders`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};
// Upload orders in bulk (for clients)
export const uploadOrders = (formData) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        throw new Error('Token not available');
    }

    return axios.post(`${API_URL}/upload-orders`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
        },
    });
};
// Delete order (client)
export const deleteOrder = (orderId) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        throw new Error("Token not available");
    }

    return axios.delete(`${API_URL}/orders/${orderId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

// Update order (client)
export const updateOrderClient = (orderId, updatedData) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        throw new Error("Token not available");
    }

    return axios.put(`${API_URL}/orders/${orderId}`, updatedData, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
};


// Fetch premium rates (admin only)
export const fetchPremiumRates = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        throw new Error('Token not available');
    }

    return axios.get(`${API_URL}/admin/api/premium-rate`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

// Create premium rate (admin only)
export const createPremiumRate = (rateData) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        throw new Error('Token not available');
    }

    return axios.post(`${API_URL}/admin/api/premium-rate`, rateData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
};

// Update premium rate (admin only)
export const updatePremiumRate = (rateId, rateData) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        throw new Error('Token not available');
    }

    return axios.put(`${API_URL}/admin/api/premium-rate/${rateId}`, rateData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
};

// Delete premium rate (admin only)
export const deletePremiumRate = (rateId) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        throw new Error('Token not available');
    }

    return axios.delete(`${API_URL}/admin/api/premium-rate/${rateId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};