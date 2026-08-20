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

// The backend's billing_addresses table/API uses `line1`/`line2`, not
// `address_line_1`/`address_line_2` — translate at the service boundary so
// the rest of the app can keep using the more readable field names.
interface BillingAddressWire {
  id: number;
  name: string;
  line1: string;
  line2?: string | null;
  city: string;
  country: string;
  tax_id?: string | null;
  is_default: boolean;
}

function fromWire(w: BillingAddressWire): BillingAddress {
  return {
    id: w.id,
    name: w.name,
    address_line_1: w.line1,
    address_line_2: w.line2,
    city: w.city,
    country: w.country,
    tax_id: w.tax_id,
    is_default: w.is_default,
  };
}

function toWire(data: Partial<BillingAddressInput>) {
  const { address_line_1, address_line_2, ...rest } = data;
  return {
    ...rest,
    ...(address_line_1 !== undefined ? { line1: address_line_1 } : {}),
    ...(address_line_2 !== undefined ? { line2: address_line_2 } : {}),
  };
}

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
  data: BillingAddressWire[];
}

interface AddressResponse {
  success: boolean;
  data: BillingAddressWire;
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

  getAddresses: () =>
    api.get<AddressListResponse>("/billing/addresses").then((res) => ({
      ...res,
      data: { ...res.data, data: res.data.data.map(fromWire) },
    })),

  createAddress: (data: BillingAddressInput) =>
    api.post<AddressResponse>("/billing/addresses", toWire(data)).then((res) => ({
      ...res,
      data: { ...res.data, data: fromWire(res.data.data) },
    })),

  updateAddress: (id: number, data: Partial<BillingAddressInput>) =>
    api.put<AddressResponse>(`/billing/addresses/${id}`, toWire(data)).then((res) => ({
      ...res,
      data: { ...res.data, data: fromWire(res.data.data) },
    })),

  deleteAddress: (id: number) => api.delete(`/billing/addresses/${id}`),

  setDefaultAddress: (id: number) =>
    api.post<AddressResponse>(`/billing/addresses/${id}/default`).then((res) => ({
      ...res,
      data: { ...res.data, data: fromWire(res.data.data) },
    })),
};
