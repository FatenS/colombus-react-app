//OrderActions
import {
    submitOrder,
    fetchOrders,
    fetchMatchedOrders,
    fetchMarketOrders,
    runMatching,
    updateOrder,
    uploadOrders,
    deleteOrder,
    updateOrderClient,fetchPremiumRates,createPremiumRate ,updatePremiumRate,deletePremiumRate

} from '../../services/OrderService';

// Action types
export const FETCH_ORDERS_SUCCESS = 'FETCH_ORDERS_SUCCESS';
export const FETCH_MATCHED_ORDERS_SUCCESS = 'FETCH_MATCHED_ORDERS_SUCCESS';
export const UPDATE_ORDERS = 'UPDATE_ORDERS'; // New action
export const UPDATE_MARKET_ORDERS = 'UPDATE_MARKET_ORDERS'; // New action
export const ORDER_FAILURE = 'ORDER_FAILURE';
export const UPLOAD_ORDERS_SUCCESS = 'UPLOAD_ORDERS_SUCCESS';
export const UPLOAD_ORDERS_FAILURE = 'UPLOAD_ORDERS_FAILURE';

// Action types for premium rates
export const FETCH_PREMIUM_RATES_SUCCESS = 'FETCH_PREMIUM_RATES_SUCCESS';
export const CREATE_PREMIUM_RATE_SUCCESS = 'CREATE_PREMIUM_RATE_SUCCESS';
export const UPDATE_PREMIUM_RATE_SUCCESS = 'UPDATE_PREMIUM_RATE_SUCCESS';
export const DELETE_PREMIUM_RATE_SUCCESS = 'DELETE_PREMIUM_RATE_SUCCESS';

// Fetch premium rates (admin only)
export const fetchPremiumRatesAction = () => async (dispatch) => {
    try {
        const response = await fetchPremiumRates();
        dispatch({ type: FETCH_PREMIUM_RATES_SUCCESS, payload: response.data });
    } catch (error) {
        console.error("Error fetching premium rates:", error);
        dispatch({ type: ORDER_FAILURE, payload: 'Error fetching premium rates' });
    }
};

// Create premium rate (admin only)
export const createPremiumRateAction = (rateData) => async (dispatch) => {
    try {
        const response = await createPremiumRate(rateData);
        dispatch({ type: CREATE_PREMIUM_RATE_SUCCESS, payload: response.data });
        dispatch(fetchPremiumRatesAction()); // Refetch premium rates after creation
    } catch (error) {
        console.error("Error creating premium rate:", error);
        dispatch({ type: ORDER_FAILURE, payload: 'Error creating premium rate' });
    }
};

// Update premium rate (admin only)
export const updatePremiumRateAction = (rateId, rateData) => async (dispatch) => {
    try {
        const response = await updatePremiumRate(rateId, rateData);
        dispatch({ type: UPDATE_PREMIUM_RATE_SUCCESS, payload: response.data });
        dispatch(fetchPremiumRatesAction()); // Refetch premium rates after update
    } catch (error) {
        console.error("Error updating premium rate:", error);
        dispatch({ type: ORDER_FAILURE, payload: 'Error updating premium rate' });
    }
};

// Delete premium rate (admin only)
export const deletePremiumRateAction = (rateId) => async (dispatch) => {
    try {
        await deletePremiumRate(rateId);
        dispatch({ type: DELETE_PREMIUM_RATE_SUCCESS, payload: rateId });
        dispatch(fetchPremiumRatesAction()); // Refetch premium rates after deletion
    } catch (error) {
        console.error("Error deleting premium rate:", error);
        dispatch({ type: ORDER_FAILURE, payload: 'Error deleting premium rate' });
    }
};

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
// Submit order (client)
export const submitOrderAction = (orderData) => async (dispatch) => {
    try {
        // 1) Get the full Axios response (with data, status, etc.)
        const response = await submitOrder(orderData);

        // 2) Optionally refetch the list of orders
        dispatch(fetchOrdersAction(false));

        // 3) Return the actual response so the component can read `res.data`
        return response;
    } catch (error) {
        console.error("Error submitting order:", error);
        dispatch({ type: ORDER_FAILURE, payload: "Error submitting order" });
        // Rethrow so the .catch in your component can see the error
        throw error;
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
// Delete order action
export const deleteOrderAction = (orderId) => async (dispatch) => {
    try {
        await deleteOrder(orderId);  // Call service to delete order
        dispatch(fetchOrdersAction(false));  // Refetch orders for client after deletion
    } catch (error) {
        console.error("Error deleting order:", error);
        dispatch({ type: ORDER_FAILURE, payload: "Error deleting order" });
    }
};

// Update order action for client updates
export const updateOrderClientAction = (orderId, updatedData) => async (dispatch) => {
    try {
        await updateOrderClient(orderId, updatedData);  // Call service to update order
        dispatch(fetchOrdersAction(false));  // Refetch orders for client after update
    } catch (error) {
        console.error("Error updating order:", error);
        dispatch({ type: ORDER_FAILURE, payload: error.message });
    }
};



