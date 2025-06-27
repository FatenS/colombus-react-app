import axiosInstance from "../../services/AxiosInstance";   // ← centralized client

// ──────────── helpers ────────────
const params = (currency) => ({ currency });

// ──────────── ACTION TYPES ───────
export const FETCH_SUMMARY_SUCCESS         = "FETCH_SUMMARY_SUCCESS";
export const FETCH_FORWARD_RATE_SUCCESS    = "FETCH_FORWARD_RATE_SUCCESS";
export const FETCH_SUPERPERFORMANCE_SUCCESS= "FETCH_SUPERPERFORMANCE_SUCCESS";
export const FETCH_BANK_GAINS_SUCCESS      = "FETCH_BANK_GAINS_SUCCESS";
export const DASHBOARD_ERROR               = "DASHBOARD_ERROR";

// ──────────── ACTION CREATORS ────
export const fetchSummary = (currency) => async (dispatch) => {
  try {
    const { data } = await axiosInstance.get(
      "/api/dashboard/summary",
      { params: params(currency) }
    );
    dispatch({ type: FETCH_SUMMARY_SUCCESS, payload: data });
  } catch (err) {
    dispatch({ type: DASHBOARD_ERROR, payload: err.message });
  }
};

export const fetchForwardRate = (currency) => async (dispatch) => {
  try {
    const { data } = await axiosInstance.get(
      "/api/dashboard/secured-vs-market-forward-rate",
      { params: params(currency) }
    );
    dispatch({ type: FETCH_FORWARD_RATE_SUCCESS, payload: data });
  } catch (err) {
    dispatch({ type: DASHBOARD_ERROR, payload: err.message });
  }
};

export const fetchSuperperformance = (currency) => async (dispatch) => {
  try {
    const { data } = await axiosInstance.get(
      "/api/dashboard/superperformance-trend",
      { params: params(currency) }
    );
    dispatch({ type: FETCH_SUPERPERFORMANCE_SUCCESS, payload: data });
  } catch (err) {
    dispatch({ type: DASHBOARD_ERROR, payload: err.message });
  }
};

export const fetchBankGains = (currency) => async (dispatch) => {
  try {
    const { data } = await axiosInstance.get(
      "/api/dashboard/bank-gains",
      { params: params(currency) }
    );
    dispatch({ type: FETCH_BANK_GAINS_SUCCESS, payload: data });
  } catch (err) {
    dispatch({ type: DASHBOARD_ERROR, payload: err.message });
  }
};
