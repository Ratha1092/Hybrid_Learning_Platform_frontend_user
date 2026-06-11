import api from "../api/axios";

export interface PaymentData {
  id: number;
  amount: number;
  qr_code_image?: string | null;
  khqr_payload?: string;
  expires_at?: string;
  expires_in_seconds?: number;
  status?: string;
  currency?: string;
}

interface CheckoutResponse {
  success: boolean;
  message?: string;
  data: {
    id: number;
    order_number: string;
    status: string;        // "pending" | "completed" (free course)
    payment_status: string;
    payment: PaymentData | null;
  };
}

interface PaymentStatusResponse {
  success: boolean;
  data: PaymentData;
}

interface VerifyResponse {
  success: boolean;
  message?: string;
  data: PaymentData;
}

export const paymentService = {
  checkout: (course_id: number) =>
    api.post<CheckoutResponse>("/orders", { course_id }),

  getStatus: (id: number) =>
    api.get<PaymentStatusResponse>(`/payments/${id}/status`),

  verify: (payment_id: number) =>
    api.post<VerifyResponse>("/payments/verify", { payment_id }),

  cancel: (payment_id: number) =>
    api.post(`/payments/${payment_id}/cancel`),
};
