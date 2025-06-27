import axiosInstance from "./AxiosInstance";       // same singleton client

const params = (currency) => ({ currency });

export const fetchSummaryData = (currency) =>
  axiosInstance
    .get("/api/dashboard/summary", { params: params(currency) })
    .then((r) => r.data);

export const fetchForwardRateData = (currency) =>
  axiosInstance
    .get("/api/dashboard/secured-vs-market-forward-rate", { params: params(currency) })
    .then((r) => r.data);

export const fetchSuperperformanceTrend = (currency) =>
  axiosInstance
    .get("/api/dashboard/superperformance-trend", { params: params(currency) })
    .then((r) => r.data);

export const fetchBankGainsData = (currency) =>
  axiosInstance
    .get("/api/dashboard/bank-gains", { params: params(currency) })
    .then((r) => r.data);
