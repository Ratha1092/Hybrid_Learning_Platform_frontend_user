import api from "../api/axios";
// បញ្ជាក់ structure នៃ data ដែល backend return មក:
export interface PaymentData {
  id: number;
  amount: number;
  qr_code_image?: string;
  khqr_payload?: string;
  expires_at?: string;
  status?: string;
}

interface CheckoutResponse {
  success: boolean;
  message?: string;
  data: {
    order: unknown;
    payment: PaymentData;
  };
}

interface PaymentStatusResponse {
  success: boolean;
  data: { status: string };
}

interface VerifyResponse {
  success: boolean;
  message?: string;
  data: { status?: string };
}

export const paymentService = {
//   → function checkout — ទទួល course_id (លេខ ID course) ហើយផ្ញើ POST request
 
  checkout: (course_id: number) =>
    api.post<CheckoutResponse>("/checkout", { course_id }),
//   → function getStatus — ផ្ញើ GET request ទៅ /payments/123/status
// ប្រើដើម្បី poll (ពិនិត្យ) រៀងរាល់ 5 វិនាទី ថា user បង់លុយហើយឬនៅ
  getStatus: (id: number) =>
    api.get<PaymentStatusResponse>(`/payments/${id}/status`),
// → function verify — ផ្ញើ POST request ដើម្បី បញ្ជាក់ការទូទាត់
// Body: { payment_id: 123 }
// Backend ពិនិត្យ → ប្រសិនបើ paid → enroll user ចូល course ភ្លាមៗ
  verify: (payment_id: number) =>
    api.post<VerifyResponse>("/payments/verify", { payment_id }),
};
