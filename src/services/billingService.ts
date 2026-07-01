import api from "../api/axios";

export interface InvoiceItem {
  id: number;
  description: string;
  unit_price: number;
  discount_amount: number;
  amount: number;
}

export interface Invoice {
  id: number;
  type: "invoice" | "credit_note";
  number: string;
  order_id: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  status: string;
  issued_at: string;
  items?: InvoiceItem[];
}

export interface BillingAddress {
  id: number;
  name: string;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  country: string;
  tax_id?: string | null;
  is_default: boolean;
}

export type BillingAddressInput = Omit<BillingAddress, "id" | "is_default">;

interface InvoiceListResponse {
  success: boolean;
  data: {
    current_page: number;
    data: Invoice[];
    per_page: number;
    last_page: number;
    total: number;
  };
}

interface InvoiceResponse {
  success: boolean;
  data: Invoice;
}

interface AddressListResponse {
  success: boolean;
  data: BillingAddress[];
}

interface AddressResponse {
  success: boolean;
  data: BillingAddress;
}

async function downloadBlob(endpoint: string, filename: string) {
  const response = await api.get(endpoint, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const billingService = {
  getInvoices: (page = 1) =>
    api.get<InvoiceListResponse>("/billing/invoices", { params: { page } }),

  getInvoice: (id: number) =>
    api.get<InvoiceResponse>(`/billing/invoices/${id}`),

  downloadInvoice: (id: number, number: string) =>
    downloadBlob(`/billing/invoices/${id}/download`, `invoice-${number}.pdf`),

  downloadBillingReceipt: (id: number, number: string) =>
    downloadBlob(`/billing/receipts/${id}/download`, `receipt-${number}.pdf`),

  getAddresses: () => api.get<AddressListResponse>("/billing/addresses"),

  createAddress: (data: BillingAddressInput) =>
    api.post<AddressResponse>("/billing/addresses", data),

  updateAddress: (id: number, data: Partial<BillingAddressInput>) =>
    api.put<AddressResponse>(`/billing/addresses/${id}`, data),

  deleteAddress: (id: number) => api.delete(`/billing/addresses/${id}`),

  setDefaultAddress: (id: number) =>
    api.post<AddressResponse>(`/billing/addresses/${id}/default`),
};
