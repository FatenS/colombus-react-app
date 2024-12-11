const initialState = {
    summary: {},
    forwardRate: [],
    superperformanceTrend: [],
    bankGains: [],
    error: null,
};

export const dashboardReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'FETCH_SUMMARY_SUCCESS':
            return { ...state, summary: action.payload };
        case 'FETCH_FORWARD_RATE_SUCCESS':
            return { ...state, forwardRate: action.payload };
        case 'FETCH_SUPERPERFORMANCE_SUCCESS':
            return { ...state, superperformanceTrend: action.payload || [], };
        case 'FETCH_BANK_GAINS_SUCCESS':
            return { ...state, bankGains: action.payload };
        case 'DASHBOARD_ERROR':
            return { ...state, error: action.payload };
        default:
            return state;
    }
};

