//OrderReducer.js
import {
    FETCH_ORDERS_SUCCESS,
    FETCH_MATCHED_ORDERS_SUCCESS,
    UPDATE_ORDERS,
    UPDATE_MARKET_ORDERS,
    ORDER_FAILURE,
    UPLOAD_ORDERS_SUCCESS,
    UPLOAD_ORDERS_FAILURE,
} from '../actions/OrderActions';

const initialState = {
    orders: [],
    marketOrders: [],
    matchedOrders: [],
    error: null,
    uploadSuccess: false,

};

export const orderReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_ORDERS_SUCCESS:
            return { ...state, orders: action.payload, error: null };
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
        default:
            return state;
    }
};