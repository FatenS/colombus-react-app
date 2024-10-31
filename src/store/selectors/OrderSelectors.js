//OrderSelector.js
import { createSelector } from 'reselect';

const selectOrderState = (state) => state.orderReducer;

export const selectOrders = createSelector(
    [selectOrderState],
    (orderState) => orderState.orders || []
);

export const selectMarketOrders = createSelector(
    [selectOrderState],
    (orderState) => orderState.marketOrders || []
);

export const selectMatchedOrders = createSelector(
    [selectOrderState],
    (orderState) => orderState.matchedOrders || []
);

export const selectOrderError = createSelector(
    [selectOrderState],
    (orderState) => orderState.error || null
);
