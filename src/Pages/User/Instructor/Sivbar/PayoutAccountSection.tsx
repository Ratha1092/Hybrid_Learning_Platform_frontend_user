import { useState, useRef } from "react";
import { CheckCircle, Clock, XCircle, Upload, X, Building2, CreditCard, QrCode, Wallet } from "lucide-react";
import {
  instructorService,
  type InstructorPayoutAccount,
} from "../../../../services/instructorService";

export const PAYOUT_METHODS = [
  { value: "bank_transfer", label: "Bank Transfer", needsAccount: true,  needsPhone: false, Icon: Building2,  iconBg: "bg-slate-100 dark:bg-slate-700",      iconCl: "text-slate-600 dark:text-slate-300"   },
  { value: "acleda",        label: "ACLEDA",        needsAccount: true,  needsPhone: false, Icon: CreditCard, iconBg: "bg-teal-100 dark:bg-teal-500/20",     iconCl: "text-teal-600 dark:text-teal-400"     },
  { value: "wing",          label: "Wing",           needsAccount: false, needsPhone: true,  Icon: Wallet,     iconBg: "bg-purple-100 dark:bg-purple-500/20", iconCl: "text-purple-600 dark:text-purple-400" },
  { value: "khqr",          label: "KHQR",           needsAccount: false, needsPhone: false, Icon: QrCode,     iconBg: "bg-indigo-100 dark:bg-indigo-500/20", iconCl: "text-indigo-600 dark:text-indigo-400" },
];

const STATUS_CFG = {
  verified: { Icon: CheckCircle, cls: "text-emerald-600 bg-emerald-50 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/30 dark:text-emerald-400", label: "Verified" },
  pending:  { Icon: Clock,       cls: "text-amber-600 bg-amber-50 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30 dark:text-amber-400",             label: "Pending verification" },
  rejected: { Icon: XCircle,    cls: "text-rose-600 bg-rose-50 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:ring-rose-500/30 dark:text-rose-400",                   label: "Rejected" },
} as const;

interface Props {
  account: InstructorPayoutAccount | null;
  onSaved: (a: InstructorPayoutAccount) => void;
}

export default function PayoutAccountSection({ account, onSaved }: Props) {
  const [editing, setEditing] = useState(!account || account.status === "rejected");
  const [form, setForm] = useState({
    method:         account?.method         ?? "bank_transfer",
    account_name:   account?.account_name   ?? "",
    account_number: account?.account_number ?? "",
    phone_number:   account?.phone_number   ?? "",
    qr_code: null as File | null,
  });
  const [preview, setPreview]   = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const methodCfg = PAYOUT_METHODS.find((m) => m.value === form.method) ?? PAYOUT_METHODS[0];
  const statusCfg = account ? STATUS_CFG[account.status] : null;

  const handleFile = (file: File) => {
    setForm((f) => ({ ...f, qr_code: file }));
    setPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === "image/jpeg" || file.type === "image/png")) handleFile(file);
  };

  const clearQr = () => {
    if (preview) URL.revokeObjectURL(preview);
    setForm((f) => ({ ...f, qr_code: null }));
    setPreview(null);
  };

  const switchMethod = (value: string) => {
    setForm((f) => ({ ...f, method: value, account_number: "", phone_number: "" }));
  };

  const handleSave = async () => {
    if (!form.account_name.trim()) { setError("Account name is required."); return; }
    if (methodCfg.needsAccount && !form.account_number.trim()) { setError("Account number is required for bank transfer."); return; }
    if (methodCfg.needsPhone && !form.phone_number.trim()) { setError("Phone number is required for this payment method."); return; }

    setSaving(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("method", form.method);
      fd.append("account_name", form.account_name);
      if (form.account_number) fd.append("account_number", form.account_number);
      if (form.phone_number)   fd.append("phone_number", form.phone_number);
      if (form.qr_code)        fd.append("qr_code", form.qr_code);
      const res = await instructorService.savePayoutAccount(fd);
      onSaved(res.data.data);
      setEditing(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string };
      const errs = e.response?.data?.errors;
      setError(errs ? Object.values(errs).flat().join(" ") : (e.response?.data?.message ?? e.message ?? "Failed to save account."));
    }
    setSaving(false);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-e1 dark:border-slate-700 dark:bg-slate-800">

      {/* ── Card header ── */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-700">
        <div>
          <h3 className="text-[16.5px] font-bold text-slate-800 dark:text-slate-100">Payout Account</h3>
          <p className="mt-0.5 text-[14px] text-slate-500 dark:text-slate-400">
            {account ? "Your registered payment account for payouts." : "Set up once — used for all future payouts."}
          </p>
        </div>
        {account && !editing && (
          <button
            onClick={() => { setEditing(true); setError(null); }}
            className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-[14px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Update
          </button>
        )}
      </div>

      {/* ── Status summary (collapsed view) ── */}
      {account && !editing && (
        <div className="px-6 py-5">
          <div className="flex flex-wrap items-center gap-4">
            {statusCfg && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[14.5px] font-bold ${statusCfg.cls}`}>
                <statusCfg.Icon className="h-3.5 w-3.5" />
                {statusCfg.label}
              </span>
            )}
            <div className="flex flex-wrap items-center gap-2.5 text-[14.5px] text-slate-600 dark:text-slate-400">
              <span className="font-semibold capitalize">{account.method.replace("_", " ")}</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span>{account.account_name}</span>
              {account.account_number && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="font-mono text-[14px]">{account.account_number}</span>
                </>
              )}
              {account.phone_number && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span>{account.phone_number}</span>
                </>
              )}
              {account.qr_code_path && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="inline-flex items-center gap-1 text-[14px] font-medium text-blue-600 dark:text-blue-400">
                    <span>📷</span> QR on file
                  </span>
                </>
              )}
            </div>
          </div>

          {account.status === "rejected" && account.rejection_reason && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[14.5px] text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
              <span className="font-semibold">Rejection reason:</span> {account.rejection_reason}
              <p className="mt-1 text-[14.5px] opacity-75">Click <span className="font-semibold">Update</span> to fix and re-submit.</p>
            </div>
          )}

          {account.status === "pending" && (
            <p className="mt-3 text-[14px] text-slate-400 dark:text-slate-500">
              An admin will review your account within 1–2 business days before you can request payouts.
            </p>
          )}
        </div>
      )}

      {/* ── Form (shown when no account OR editing) ── */}
      {(!account || editing) && (
        <div className="px-6 py-5">

          {/* Rejection notice */}
          {account?.status === "rejected" && account.rejection_reason && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[14.5px] text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
              <span className="font-semibold">Rejected:</span> {account.rejection_reason}
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[14.5px] font-medium text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
              ⚠ {error}
            </div>
          )}

          {/* Method selector */}
          <div className="mb-5">
            <label className="mb-3 block text-[14.5px] font-semibold text-slate-700 dark:text-slate-300">
              Payment method
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {PAYOUT_METHODS.map((m) => {
                const active = form.method === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => switchMethod(m.value)}
                    className={`flex items-center gap-3 rounded-xl border-2 px-3.5 py-3 text-left transition-all duration-150 ${
                      active
                        ? "border-blue-500 bg-white shadow-sm dark:border-blue-400 dark:bg-slate-700/60"
                        : "border-transparent bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-700/40 dark:hover:bg-slate-700/70"
                    }`}
                  >
                    {/* Icon */}
                    <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${m.iconBg}`}>
                      <m.Icon className={`h-4 w-4 ${m.iconCl}`} />
                    </div>

                    {/* Label */}
                    <span className="flex-1 text-[14.5px] font-bold text-slate-800 dark:text-slate-100">
                      {m.label}
                    </span>

                    {/* Toggle */}
                    <div className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
                      active ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-500"
                    }`}>
                      <div className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow transition-transform duration-200 ${
                        active ? "translate-x-[22px]" : "translate-x-[3px]"
                      }`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text fields */}
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-[14.5px] font-semibold text-slate-700 dark:text-slate-300">
                Account name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Full name as registered with the payment provider"
                value={form.account_name}
                onChange={(e) => setForm((f) => ({ ...f, account_name: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[16.5px] text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700/50 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>

            {methodCfg.needsAccount && (
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[14.5px] font-semibold text-slate-700 dark:text-slate-300">
                  Account number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Bank account number"
                  value={form.account_number}
                  onChange={(e) => setForm((f) => ({ ...f, account_number: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[16.5px] font-mono text-slate-900 outline-none transition-all placeholder:font-sans placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700/50 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
            )}

            {methodCfg.needsPhone && (
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[14.5px] font-semibold text-slate-700 dark:text-slate-300">
                  Phone number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="+855 12 345 678"
                  value={form.phone_number}
                  onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[16.5px] text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700/50 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
            )}
          </div>

          {/* QR code upload */}
          <div className="mb-6">
            <label className="mb-1.5 block text-[14.5px] font-semibold text-slate-700 dark:text-slate-300">
              QR code{" "}
              {form.method === "khqr"
                ? <span className="text-rose-500">*</span>
                : <span className="font-normal text-slate-400">(optional)</span>}
            </label>
            <p className="mb-2.5 text-[14.5px] text-slate-400 dark:text-slate-500">
              Upload a screenshot of your payment QR so the admin can send funds directly.
            </p>

            {preview ? (
              <div className="flex items-start gap-4">
                <div className="relative">
                  <img
                    src={preview}
                    alt="QR preview"
                    className="h-36 w-36 rounded-xl border border-slate-200 object-contain p-1.5 dark:border-slate-600"
                  />
                  <button
                    onClick={clearQr}
                    className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-rose-500 text-white shadow hover:bg-rose-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="pt-1">
                  <p className="text-[14.5px] font-semibold text-slate-700 dark:text-slate-300">{form.qr_code?.name}</p>
                  <p className="mt-0.5 text-[14.5px] text-slate-400">
                    {form.qr_code ? `${(form.qr_code.size / 1024).toFixed(0)} KB` : ""}
                  </p>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="mt-2 text-[14px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Replace image
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-slate-200 py-8 transition-colors hover:border-blue-400 hover:bg-blue-50/40 dark:border-slate-600 dark:hover:border-blue-500 dark:hover:bg-blue-500/5"
              >
                {account?.qr_code_path ? (
                  <>
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 dark:bg-emerald-500/15">
                      <span className="text-xl">📷</span>
                    </div>
                    <p className="text-[14.5px] font-semibold text-emerald-600 dark:text-emerald-400">QR image on file</p>
                    <p className="text-[14.5px] text-slate-400">Click or drag to replace</p>
                  </>
                ) : (
                  <>
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 dark:bg-slate-700">
                      <Upload className="h-5 w-5 text-slate-400" />
                    </div>
                    <p className="text-[14.5px] font-semibold text-slate-600 dark:text-slate-300">Drop QR image here</p>
                    <p className="text-[14.5px] text-slate-400">JPG or PNG · max 5 MB</p>
                  </>
                )}
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
            />
          </div>

          {/* Form actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-[16.5px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Submitting…" : "Submit for Verification"}
            </button>
            {account && editing && (
              <button
                onClick={() => { setEditing(false); setError(null); clearQr(); }}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-[16.5px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
