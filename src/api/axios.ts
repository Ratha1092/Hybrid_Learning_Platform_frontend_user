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
    const status: number = error.response?.status ?? 0;
    const url: string = error.config?.url ?? "";

    const shouldLogout =
      status === 401 ||
      (status === 400 && url.includes("/users/me"));

    if (shouldLogout) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/PageLogin";
    }

    return Promise.reject(error);
  }
);

export default api;
