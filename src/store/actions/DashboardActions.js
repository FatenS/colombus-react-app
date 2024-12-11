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

// Fetch summary action
export const fetchSummary = (currency) => async (dispatch) => {
    const token = getToken();
    try {
        const response = await axios.get(`${API_URL}/api/dashboard/summary?currency=${currency}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        dispatch({
            type: 'FETCH_SUMMARY_SUCCESS',
            payload: response.data,
        });
    } catch (error) {
        dispatch({
            type: 'DASHBOARD_ERROR',
            payload: error.message,
        });
    }
};

// Fetch forward rate action
export const fetchForwardRate = (currency) => async (dispatch) => {
    const token = getToken();
    try {
        const response = await axios.get(`${API_URL}/api/dashboard/secured-vs-market-forward-rate?currency=${currency}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        dispatch({
            type: 'FETCH_FORWARD_RATE_SUCCESS',
            payload: response.data,
        });
    } catch (error) {
        dispatch({
            type: 'DASHBOARD_ERROR',
            payload: error.message,
        });
    }
};

// Fetch superperformance trend action
export const fetchSuperperformance = (currency) => async (dispatch) => {
    const token = getToken();
    try {
        const response = await axios.get(`${API_URL}/api/dashboard/superperformance-trend?currency=${currency}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        dispatch({
            type: 'FETCH_SUPERPERFORMANCE_SUCCESS',
            payload: response.data,
        });
    } catch (error) {
        dispatch({
            type: 'DASHBOARD_ERROR',
            payload: error.message,
        });
    }
};

// Fetch bank gains action
export const fetchBankGains = (currency) => async (dispatch) => {
    const token = getToken();
    try {
        const response = await axios.get(`${API_URL}/api/dashboard/bank-gains?currency=${currency}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        dispatch({
            type: 'FETCH_BANK_GAINS_SUCCESS',
            payload: response.data,
        });
    } catch (error) {
        dispatch({
            type: 'DASHBOARD_ERROR',
            payload: error.message,
        });
    }
};
