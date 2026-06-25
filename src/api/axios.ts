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

export const MAINTENANCE_EVENT = "app:maintenance";

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status: number = error.response?.status ?? 0;

    if (status === 503) {
      const message: string =
        error.response?.data?.message ??
        "The platform is currently undergoing maintenance. Please check back shortly.";
      window.dispatchEvent(new CustomEvent(MAINTENANCE_EVENT, { detail: message }));
      return Promise.reject(error);
    }

    const shouldLogout = status === 401;

    if (shouldLogout) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default api;
