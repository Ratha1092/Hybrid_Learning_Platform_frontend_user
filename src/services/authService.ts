  import axios from "axios";
  import api from "../api/axios";
  import type { AuthUser } from "../context/AuthContext";

  const csrfApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL as string,
    withCredentials: true,
  });

  export interface LoginPayload {
    email: string;
    password: string;
  }

  export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    otp_code?: string;
  }

  export interface AuthResponse {
    message: string;
    data: {
      token?: string;
      user: AuthUser;
    };
  }

  export interface OAuthResponse {
    success: boolean;
    message: string;
    data: {
      token?: string;
      user: AuthUser;
      is_new_user: boolean;
    };
  }

  export interface GoogleOAuthPayload {
    id_token: string;
    provider_id: string;
    email: string;
    name: string;
    avatar?: string | null;
  }

  export const authService = {
    csrf: () => csrfApi.get("/sanctum/csrf-cookie"),

    login: (payload: LoginPayload) =>
      api.post<AuthResponse>("/auth/login", payload),

    register: (payload: RegisterPayload) =>
      api.post<AuthResponse>("/auth/register", payload),

    logout: () => api.post("/auth/logout"),

    sendOtp: (email: string) =>
      api.post<{ success: boolean; message: string }>("/auth/otp/send", { email }),

    resendVerificationEmail: (email: string) =>
      api.post<{ success: boolean; message: string }>("/auth/email/send", { email }),

    verifyOtp: (email: string, code: string) =>
      api.post<{ success: boolean; message: string; data: { verified: boolean } }>("/auth/otp/verify", { email, code }),
    googleOAuth: (payload: GoogleOAuthPayload) =>
      api.post<OAuthResponse>("/auth/oauth/google", payload, { timeout: 20000 }),

    githubOAuth: (code: string) =>
      api.post<OAuthResponse>("/auth/oauth/github", { code }, { timeout: 20000 }),
  };
