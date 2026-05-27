import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url: string = error.config?.url ?? "";
      // Only force-logout on core auth endpoints, not feature APIs that may lack permissions
      const isCoreAuth = url.includes("/auth/") || url.includes("/instructor/") || url.includes("/user/");
      if (isCoreAuth) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/PageLogin";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
