import api from "../api/axios";

export interface OrderItem {
  id: number;
  course_id: number;
  course_title: string;
  course_thumbnail?: string | null;
  price: number;
}

export interface OrderPayment {
  id: number;
  status: string;
  amount: number;
  method?: string;
  paid_at?: string | null;
}

export interface Order {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount?: number;
  discount_amount?: number;
  final_amount?: number;
  tax_amount?: number | null;
  coupon_code?: string | null;
  invoice_id?: number | null;
  invoice_number?: string | null;
  receipt_id?: number | null;
  receipt_number?: string | null;
  items: OrderItem[];
  payment?: OrderPayment | null;
  created_at: string;
}

interface OrderListResponse {
  success: boolean;
  data: {
    current_page: number;
    data: Order[];
    per_page: number;
    last_page: number;
    total: number;
  };
}

interface OrderResponse {
  success: boolean;
  data: Order;
}

export const orderService = {
  list: (page = 1, per_page = 15) =>
    api.get<OrderListResponse>("/orders", { params: { page, per_page } }),

  get: (id: number) => api.get<OrderResponse>(`/orders/${id}`),

  downloadReceipt: async (id: number, orderNumber: string) => {
    const response = await api.get(`/orders/${id}/receipt`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = `receipt-${orderNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
