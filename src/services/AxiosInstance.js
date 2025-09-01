// src/store/utils/axiosInstance.js   (or whatever path you already use)
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5001/",
  // baseURL: "https://backend.colombus-capital.com/",   // or your actual backend URL

  withCredentials: true               // ← send cookies automatically
});

axios.defaults.withCredentials = true;

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
// src/store/utils/axiosInstance.js
axiosInstance.interceptors.response.use(
  res => res,
  async err => {
    const orig = err.config;

   // 1) If the 401 came back from the refresh endpoint itself, stop right here:
    if (orig.url?.endsWith("/admin/token/refresh")) {
     // you've already tried to refresh and it failed → force login
      if (window.location.pathname !== '/') {
        window.location.href = "/login";
      }
      return Promise.reject(err);
   }

   // 2) Otherwise: if 401 and we haven’t retried yet, try one silent refresh
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      try {
       await axiosInstance.post("/admin/token/refresh");
        // token is now fresh, replay the original request
       return axiosInstance(orig);
      } catch (refreshErr) {
        // refresh failed → force login
        if (window.location.pathname !== '/') {
          window.location.href = "/login";
        }
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;
