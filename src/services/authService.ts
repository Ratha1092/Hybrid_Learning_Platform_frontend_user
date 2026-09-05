  import axios from "axios";
  import api from "../api/axios";
  import type { AuthUser } from "../context/AuthContext";

  const csrfApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL as string,
    withCredentials: true,
    withXSRFToken: true,
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

  export interface TwoFactorChallenge {
    requires_2fa: true;
    challenge_token: string;
    email: string;
    expires_in: number;
    // Only present outside production — lets a dev/staging environment
    // complete the flow without a real inbox.
    code?: string;
  }

  export interface LoginResponse {
    message: string;
    data: TwoFactorChallenge | { token: string; user: AuthUser };
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
      api.post<LoginResponse>("/auth/login", payload),

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

    // 2FA — completing a login that returned a { requires_2fa } challenge.
    send2faLoginCode: (challenge_token: string) =>
      api.post<{ success: boolean; message: string; data: { challenge_token: string; expires_in: number; code?: string } }>(
        "/auth/2fa/code",
        { challenge_token }
      ),

    verify2faLogin: (challenge_token: string, code: string) =>
      api.post<{ success: boolean; message: string; data: { token: string; user: AuthUser } }>(
        "/auth/2fa/verify",
        { challenge_token, code }
      ),

    // 2FA — managing it on an already-authenticated account.
    get2faStatus: () =>
      api.get<{ success: boolean; data: { two_factor_enabled: boolean } }>("/auth/2fa/status"),

    enable2fa: () =>
      api.post<{ success: boolean; message: string; data: { message: string; code?: string } }>("/auth/2fa/enable"),

    verifyEnable2fa: (code: string) =>
      api.post<{ success: boolean; message: string }>("/auth/2fa/verify-enable", { code }),

    disable2fa: (password: string) =>
      api.post<{ success: boolean; message: string }>("/auth/2fa/disable", { password }),

    // current_password is omitted entirely for OAuth-only accounts (has_password: false),
    // which is allowed to set a password for the first time without one.
    updatePassword: (data: { current_password?: string; password: string; password_confirmation: string }) =>
      api.put<{ success: boolean; message: string }>("/auth/password", data),
  };
