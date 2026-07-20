import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export const MAINTENANCE_EVENT = "app:maintenance";
export const SUSPENDED_EVENT = "app:suspended";

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
    if (status === 403) {
      const data = error.response?.data ?? {};
      const message: string = data.message ?? "";
      if (data.error_code === "account_suspended" || /suspended/i.test(message)) {
        localStorage.removeItem("user");
        window.dispatchEvent(new CustomEvent(SUSPENDED_EVENT, { detail: message }));
        return Promise.reject(error);
      }
    }

    if (status === 401) {
      localStorage.removeItem("user");
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default api;
