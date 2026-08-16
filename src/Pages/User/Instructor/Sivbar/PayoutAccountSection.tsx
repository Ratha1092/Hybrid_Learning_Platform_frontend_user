import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, Clock, XCircle, Upload, X, ZoomIn } from "lucide-react";
import {
  instructorService,
  type InstructorPayoutAccount,
} from "../../../../services/instructorService";

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
    account_name: account?.account_name ?? "",
    qr_code: null as File | null,
  });
  const [preview, setPreview]   = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [viewQrUrl, setViewQrUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const handleSave = async () => {
    if (!form.account_name.trim()) { setError("Account name is required."); return; }
    if (!form.qr_code && !account?.qr_code_path) { setError("Please upload your payment QR code."); return; }

    setSaving(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("account_name", form.account_name);
      if (form.qr_code) fd.append("qr_code", form.qr_code);
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
              <span className="font-semibold">{account.account_name}</span>
              {account.qr_code_url && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <button
                    type="button"
                    onClick={() => setViewQrUrl(account.qr_code_url!)}
                    className="group relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600"
                    title="View QR code"
                  >
                    <img
                      src={account.qr_code_url}
                      alt="Payout QR code"
                      className="h-full w-full object-contain p-0.5"
                    />
                    <span className="absolute inset-0 hidden items-center justify-center bg-black/50 group-hover:flex">
                      <ZoomIn className="h-4 w-4 text-white" />
                    </span>
                  </button>
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

          {/* Account name */}
          <div className="mb-5">
            <label className="mb-1.5 block text-[14.5px] font-semibold text-slate-700 dark:text-slate-300">
              Bank account name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Full name as registered with your bank"
              value={form.account_name}
              onChange={(e) => setForm((f) => ({ ...f, account_name: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[16.5px] text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700/50 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          {/* QR code upload */}
          <div className="mb-6">
            <label className="mb-1.5 block text-[14.5px] font-semibold text-slate-700 dark:text-slate-300">
              Payment QR code <span className="text-rose-500">*</span>
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
                {account?.qr_code_url ? (
                  <>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setViewQrUrl(account.qr_code_url!); }}
                      className="group relative h-36 w-36 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600"
                      title="View full size"
                    >
                      <img
                        src={account.qr_code_url}
                        alt="Payout QR code on file"
                        className="h-full w-full object-contain p-1.5"
                      />
                      <span className="absolute inset-0 hidden items-center justify-center bg-black/50 group-hover:flex">
                        <ZoomIn className="h-6 w-6 text-white" />
                      </span>
                    </button>
                    <p className="text-[14.5px] font-semibold text-emerald-600 dark:text-emerald-400">QR image on file</p>
                    <p className="text-[14.5px] text-slate-400">Click image to view · click below to replace</p>
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

      {/* QR full-size viewer */}
      {viewQrUrl && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-[2px]"
          onClick={() => setViewQrUrl(null)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={viewQrUrl}
              alt="Payout QR code full size"
              className="max-h-[80vh] max-w-[90vw] rounded-2xl border-4 border-white bg-white object-contain shadow-2xl"
            />
            <button
              onClick={() => setViewQrUrl(null)}
              className="absolute -right-3 -top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-slate-700 shadow-lg hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
