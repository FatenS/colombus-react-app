// src/store/utils/axiosInstance.js   (or whatever path you already use)
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5001/",
  withCredentials: true               // ← send cookies automatically
});

/* -----------------------  REQUEST interceptor  ----------------------- */
axiosInstance.interceptors.request.use(cfg => {
  /* 1)  DROP the ?auth=<token> param – we no longer send idToken */
  //   const state = store.getState();
  //   const token = state.auth.auth.idToken;
  //   cfg.params = cfg.params || {};
  //   cfg.params["auth"] = token;

  /* 2)  ADD CSRF header that Flask-JWT sets as a cookie */
  const csrf = document.cookie
    .split("; ")
    .find(r => r.startsWith("csrf_access_token="))
    ?.split("=")[1];
  if (csrf) cfg.headers["X-CSRF-TOKEN"] = csrf;

  return cfg;
});

/* -----------------------  RESPONSE interceptor  ---------------------- */
/* Silent refresh once if access_token is expired                         */
axiosInstance.interceptors.response.use(
  res => res,
  async err => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      try {
        await axiosInstance.post("/admin/token/refresh");  
        return axiosInstance(orig);                       
      } catch {
        window.location.href = "/login";                  
      }
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;
