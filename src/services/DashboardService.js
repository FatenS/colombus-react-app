import axios from 'axios';

const API_URL = 'http://localhost:5001';

// Helper function to get the token
const getToken = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        throw new Error('Token not available');
    }
    return token;
};

// Fetch summary data
export const fetchSummaryData = async (currency) => {
    const token = getToken();
    const response = await axios.get(`${API_URL}/api/dashboard/summary?currency=${currency}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data; // Returns the summary data
};

// Fetch forward rate data
export const fetchForwardRateData = async (currency) => {
    const token = getToken();
    const response = await axios.get(`${API_URL}/api/dashboard/secured-vs-market-forward-rate?currency=${currency}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data; // Returns the forward rate data
};

// Fetch superperformance trend
export const fetchSuperperformanceTrend = async (currency) => {
    const token = getToken();
    const response = await axios.get(`${API_URL}/api/dashboard/superperformance-trend?currency=${currency}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data; // Returns the superperformance trend data
};

// Fetch bank gains data
export const fetchBankGainsData = async (currency) => {
    const token = getToken();
    const response = await axios.get(`${API_URL}/api/dashboard/bank-gains?currency=${currency}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data; // Returns the bank gains data
};
