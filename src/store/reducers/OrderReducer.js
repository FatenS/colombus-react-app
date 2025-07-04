import {
    FETCH_ORDERS_SUCCESS,
    FETCH_MATCHED_ORDERS_SUCCESS,
    UPDATE_ORDERS,
    UPDATE_MARKET_ORDERS,
    ORDER_FAILURE,
    UPLOAD_ORDERS_SUCCESS,
    UPLOAD_ORDERS_FAILURE,
    FETCH_PREMIUM_RATES_SUCCESS,
    CREATE_PREMIUM_RATE_SUCCESS,
    UPDATE_PREMIUM_RATE_SUCCESS,
    DELETE_PREMIUM_RATE_SUCCESS,
} from '../actions/OrderActions';

const initialState = {
    orders: [],
    marketOrders: [],
    matchedOrders: [],
    premiumRates: [], // Add premiumRates to the state
    error: null,
    uploadSuccess: false,
};

export const orderReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_ORDERS_SUCCESS:
             return {
                   ...state,
                    orders: Array.isArray(action.payload)
                          ? action.payload
                          : JSON.parse(action.payload),   // parse if someone sent a string
                  error: null,
               };
        case FETCH_MATCHED_ORDERS_SUCCESS:
            return { ...state, matchedOrders: action.payload, error: null };
        case UPDATE_ORDERS:
            return { ...state, orders: action.payload, error: null };
        case UPDATE_MARKET_ORDERS:
            return { ...state, marketOrders: action.payload, error: null };
        case UPLOAD_ORDERS_SUCCESS:
            return { ...state, uploadSuccess: true, error: null };
        case UPLOAD_ORDERS_FAILURE:
            return { ...state, uploadSuccess: false, error: action.payload };
        case ORDER_FAILURE:
            return { ...state, error: action.payload };
        case FETCH_PREMIUM_RATES_SUCCESS:
            return { ...state, premiumRates: action.payload, error: null };
        case CREATE_PREMIUM_RATE_SUCCESS:
            return { ...state, premiumRates: [...state.premiumRates, action.payload], error: null };
        case UPDATE_PREMIUM_RATE_SUCCESS:
            return {
                ...state,
                premiumRates: state.premiumRates.map((rate) =>
                    rate.id === action.payload.id ? action.payload : rate
                ),
                error: null,
            };
        case DELETE_PREMIUM_RATE_SUCCESS:
            return {
                ...state,
                premiumRates: state.premiumRates.filter((rate) => rate.id !== action.payload),
                error: null,
            };
        default:
            return state;
    }
};