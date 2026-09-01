import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, AlertCircle } from "lucide-react";
import { instructorService, type PayoutRequest } from "../../../../services/instructorService";

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending:  { label: "Pending",  cls: "bg-amber-50 text-amber-600 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30" },
  approved: { label: "Paid",     cls: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30" },
  rejected: { label: "Rejected", cls: "bg-rose-50 text-rose-600 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/30" },
};

function safeNum(v: unknown): number {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(safeNum(n));
}

function fmtDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"
      style={{ width: size, height: size }}
    />
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-[13px] text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100">{value}</span>
    </div>
  );
}

export default function PayoutDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [payout, setPayout] = useState<PayoutRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    instructorService.getPayoutById(id)
      .then(({ data }) => setPayout(data.data))
      .catch((e: unknown) => {
        const err = e as { response?: { status?: number; data?: { message?: string } }; message?: string };
        setError(
          err.response?.status === 404
            ? "This payout request could not be found."
            : err.response?.data?.message ?? "Failed to load payout request."
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownloadReceipt = async () => {
    if (!payout?.receipt_id) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      await instructorService.downloadPayoutReceipt(
        payout.receipt_id,
        `PYT-${new Date(payout.updated_at).getFullYear()}-${String(payout.receipt_id).padStart(6, "0")}`
      );
    } catch {
      setDownloadError("Receipt download failed. Please try again.");
    }
    setDownloading(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <button
          onClick={() => navigate("/instructor/revenue")}
          className="mb-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13.5px] font-semibold text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Payouts
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-[26px] font-extrabold text-slate-900 dark:text-white">
            Payout Request{payout ? ` #${payout.id}` : ""}
          </h1>
          {payout && (
            <span className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[12px] font-bold capitalize ${(STATUS_CFG[payout.status] ?? { cls: "bg-slate-50 text-slate-500 ring-1 ring-slate-200" }).cls}`}>
              {STATUS_CFG[payout.status]?.label ?? payout.status}
            </span>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner size={32} />
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center dark:border-rose-500/20 dark:bg-rose-500/10">
          <AlertCircle className="h-8 w-8 text-rose-500" />
          <p className="text-[14px] font-semibold text-rose-600 dark:text-rose-400">{error}</p>
          <button
            onClick={() => navigate("/instructor/revenue")}
            className="mt-1 rounded-lg border border-rose-200 bg-white px-4 py-2 text-[13px] font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:bg-transparent dark:hover:bg-rose-500/10"
          >
            Back to Payouts
          </button>
        </div>
      )}

      {!loading && !error && payout && (
        <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Amount</p>
              <p className="mt-1 text-[32px] font-extrabold text-slate-900 dark:text-white">
                ${fmt(payout.amount)} <span className="text-[15px] font-semibold text-slate-400">{payout.currency ?? "USD"}</span>
              </p>

              <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-700 dark:border-slate-700">
                <Row label="Payment method" value={<span className="capitalize">{payout.payment_method.replace(/_/g, " ")}</span>} />
                <Row
                  label="Requested"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      {fmtDate(payout.requested_at ?? payout.created_at)}
                      {payout.source === "monthly_auto" && (
                        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-violet-600 ring-1 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/30">
                          Auto
                        </span>
                      )}
                    </span>
                  }
                />
                {payout.processed_at && <Row label="Processed" value={fmtDate(payout.processed_at)} />}
                {payout.transaction_reference && <Row label="Transaction reference" value={payout.transaction_reference} />}
              </div>

              {payout.status === "rejected" && payout.rejection_reason && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                  <p className="font-semibold">Rejection reason</p>
                  <p className="mt-1">{payout.rejection_reason}</p>
                </div>
              )}

              {payout.status === "approved" && payout.receipt_id && (
                <div className="mt-4">
                  {downloadError && <p className="mb-2 text-[12.5px] font-medium text-rose-600 dark:text-rose-400">{downloadError}</p>}
                  <button
                    onClick={handleDownloadReceipt}
                    disabled={downloading}
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-[13px] font-semibold text-blue-600 transition-colors hover:bg-blue-100 disabled:opacity-50 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400"
                  >
                    {downloading ? <Spinner size={14} /> : <Download className="h-4 w-4" />}
                    Download Receipt
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {payout.payout_account && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Paid To</p>
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  <Row label="Method" value={<span className="capitalize">{payout.payout_account.method}</span>} />
                  <Row label="Account name" value={payout.payout_account.account_name} />
                  {payout.payout_account.account_number && (
                    <Row label="Account number" value={payout.payout_account.account_number} />
                  )}
                  {payout.payout_account.phone_number && (
                    <Row label="Phone" value={payout.payout_account.phone_number} />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
