//OrderActions
import {
    submitOrder,
    fetchOrders,
    fetchMatchedOrders,
    fetchMarketOrders,
    runMatching,
    updateOrder,
    uploadOrders,
} from '../../services/OrderService';

// Action types
export const FETCH_ORDERS_SUCCESS = 'FETCH_ORDERS_SUCCESS';
export const FETCH_MATCHED_ORDERS_SUCCESS = 'FETCH_MATCHED_ORDERS_SUCCESS';
export const UPDATE_ORDERS = 'UPDATE_ORDERS'; // New action
export const UPDATE_MARKET_ORDERS = 'UPDATE_MARKET_ORDERS'; // New action
export const ORDER_FAILURE = 'ORDER_FAILURE';
export const UPLOAD_ORDERS_SUCCESS = 'UPLOAD_ORDERS_SUCCESS';
export const UPLOAD_ORDERS_FAILURE = 'UPLOAD_ORDERS_FAILURE';

// Fetch orders based on role (client or admin)
export const fetchOrdersAction = (isAdmin) => async (dispatch) => {
    try {
        const response = await fetchOrders(isAdmin);
        dispatch({ type: FETCH_ORDERS_SUCCESS, payload: response.data });
    } catch (error) {
        console.error(error);
        dispatch({ type: ORDER_FAILURE, payload: 'Error fetching orders' });
    }
};

// Fetch matched orders (admin only)
export const fetchMatchedOrdersAction = () => async (dispatch) => {
    try {
        const response = await fetchMatchedOrders();
        dispatch({ type: FETCH_MATCHED_ORDERS_SUCCESS, payload: response.data });
    } catch (error) {
        console.error(error);
        dispatch({ type: ORDER_FAILURE, payload: 'Error fetching matched orders' });
    }
};

// Submit order (client)
export const submitOrderAction = (orderData) => async (dispatch) => {
    try {
        await submitOrder(orderData);  // Call the service to submit the order
        dispatch(fetchOrdersAction(false));  // Refetch orders after submission
    } catch (error) {
        console.error("Error submitting order:", error);
        dispatch({ type: ORDER_FAILURE, payload: 'Error submitting order' });
    }
};


// Update order (admin)
export const updateOrderAction = (orderId, updatedData) => async (dispatch) => {
    try {
        await updateOrder(orderId, updatedData);
    } catch (error) {
        console.error("Error updating order:", error);
        dispatch({ type: ORDER_FAILURE, payload: error.message });
    }
};

// Run matching process (admin)
export const runMatchingAction = () => async (dispatch) => {
    try {
        await runMatching();
        dispatch(fetchMatchedOrdersAction());
    } catch (error) {
        console.error(error);
        dispatch({ type: ORDER_FAILURE, payload: 'Error running matching process' });
    }
};

// In fetchMarketOrdersAction
export const fetchMarketOrdersAction = () => async (dispatch) => {
    try {
        const response = await fetchMarketOrders(); // Call the service for market orders
        dispatch({ type: UPDATE_MARKET_ORDERS, payload: response.data });
    } catch (error) {
        console.error(error);
        if (error.response && error.response.status === 401) {
            // If unauthorized, redirect to login
            window.location.href = '/login';
        }
        dispatch({ type: ORDER_FAILURE, payload: 'Error fetching market orders' });
    }
};

// Update market order (admin)
export const updateMarketOrderAction = (orderId, updatedData) => async (dispatch) => {
    try {
        await updateOrder(orderId, updatedData);
        dispatch(fetchMarketOrdersAction()); // Fetch market orders after updating
    } catch (error) {
        console.error("Error updating market order:", error);
        dispatch({ type: ORDER_FAILURE, payload: error.message });
    }
};

// Upload orders in bulk (client)
export const uploadOrdersAction = (formData) => async (dispatch) => {
    try {
        await uploadOrders(formData);  // Call the service to upload orders
        dispatch(fetchOrdersAction(false));  // Refetch orders for client after upload
        dispatch(fetchMatchedOrdersAction());
        dispatch({ type: UPLOAD_ORDERS_SUCCESS });
    } catch (error) {
        console.error("Error uploading orders:", error);
        dispatch({ type: UPLOAD_ORDERS_FAILURE, payload: 'Error uploading orders' });
    }
};