import axios from "axios";

export const api = axios.create({
  baseURL: "https://backend.colombus-capital.com/", 
  // baseURL: "http://localhost:5001/",
   // or your actual backend URL
  withCredentials: true
});

// attach CSRF token from cookie
api.interceptors.request.use(cfg => {
  const csrf = document.cookie
    .split("; ")
    .find(r => r.startsWith("csrf_access_token="))
    ?.split("=")[1];
  if (csrf) cfg.headers["X-CSRF-TOKEN"] = csrf;
  return cfg;
});

// one-time refresh retry
api.interceptors.response.use(
  res => res,
  async err => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      try {
        await api.post("/admin/token/refresh");
        return api(orig);              // replay original call
      } catch {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);
