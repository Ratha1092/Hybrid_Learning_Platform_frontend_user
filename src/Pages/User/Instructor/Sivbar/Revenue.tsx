import { useEffect, useState } from "react";
import { Download, ArrowRight } from "lucide-react";
import {
  instructorService,
  type WalletData,
  type EarningsData,
  type Transaction,
  type PayoutRequest,
} from "../../../../services/instructorService";
import "../css/Revenue.css";

const PAYMENT_METHODS = [
  { value: "bank",   label: "🏦 Bank Transfer" },
  { value: "momo",   label: "📱 MOMO" },
  { value: "acleda", label: "🏧 ACLEDA" },
  { value: "wing",   label: "🦋 Wing" },
];

type Tab = "overview" | "payouts";

const STATUS_STYLES: Record<string, string> = {
  pending:  "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  approved: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  rejected: "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400",
};

export default function Revenue() {
  const [tab, setTab]              = useState<Tab>("overview");
  const [wallet, setWallet]        = useState<WalletData | null>(null);
  const [earnings, setEarnings]    = useState<EarningsData | null>(null);
  const [txns, setTxns]            = useState<Transaction[]>([]);
  const [loading, setLoading]      = useState(true);
  const [apiError, setApiError]    = useState(false);

  // Payout request state
  const [payouts, setPayouts]             = useState<PayoutRequest[]>([]);
  const [payoutsPage, setPayoutsPage]     = useState(1);
  const [payoutsLastPage, setPayoutsLastPage] = useState(1);
  const [loadingPayouts, setLoadingPayouts]   = useState(false);

  // Payout form
  const [showPayout, setShowPayout]     = useState(false);
  const [payoutForm, setPayoutForm]     = useState({ amount: "", payment_method: "bank" });
  const [payoutSaving, setPayoutSaving] = useState(false);
  const [payoutError, setPayoutError]   = useState<string | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  // Receipt download
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      instructorService.getWallet(),
      instructorService.getEarnings(),
      instructorService.getTransactions(),
    ])
      .then(([w, e, t]) => {
        setWallet(w.data.data);
        setEarnings(e.data.data);
        setTxns(Array.isArray(t.data.data) ? t.data.data : []);
      })
      .catch(() => setApiError(true))
      .finally(() => setLoading(false));
  }, []);

  const fetchPayouts = async (page: number) => {
    setLoadingPayouts(true);
    try {
      const res = await instructorService.getPayoutRequests(page);
      setPayouts(res.data.data.data ?? []);
      setPayoutsLastPage(res.data.data.last_page ?? 1);
      setPayoutsPage(res.data.data.current_page ?? page);
    } catch { /* show empty */ }
    setLoadingPayouts(false);
  };

  useEffect(() => {
    if (tab === "payouts") fetchPayouts(1);
  }, [tab]);

  const handlePayout = async () => {
    if (!payoutForm.amount || Number(payoutForm.amount) <= 0) {
      setPayoutError("Please enter a valid amount."); return;
    }
    setPayoutSaving(true); setPayoutError(null);
    try {
      await instructorService.requestPayout({
        amount: Number(payoutForm.amount),
        payment_method: payoutForm.payment_method,
      });
      setPayoutSuccess(true);
      setShowPayout(false);
      setPayoutForm({ amount: "", payment_method: "bank" });
      const [w] = await Promise.all([instructorService.getWallet()]);
      setWallet(w.data.data);
      if (tab === "payouts") fetchPayouts(1);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setPayoutError(e.response?.data?.message ?? e.message ?? "Failed to request payout.");
    }
    setPayoutSaving(false);
  };

  const handleDownloadReceipt = async (payout: PayoutRequest) => {
    if (!payout.receipt_id) return;
    setDownloadingId(payout.id); setDownloadError(null);
    try {
      await instructorService.downloadPayoutReceipt(
        payout.receipt_id,
        `PYT-${new Date(payout.updated_at).getFullYear()}-${String(payout.receipt_id).padStart(6, "0")}`
      );
    } catch {
      setDownloadError("Receipt download failed. Please try again.");
    }
    setDownloadingId(null);
  };

  const maxTrend = earnings?.monthly_trend?.reduce((m, t) => Math.max(m, Number(t.amount)), 1) ?? 1;

  if (loading) return <div className="rv-loading"><div className="rv-spinner" /></div>;

  if (apiError) {
    return (
      <div className="rv-page">
        <h1 className="rv-title">Revenue</h1>
        <div style={{ marginTop: 32, padding: "32px 24px", background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#374151", margin: "0 0 8px" }}>Revenue data unavailable</p>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
            The finance API endpoints are not accessible.<br />
            Please contact the backend team to enable instructor revenue access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rv-page">
      {/* Header */}
      <div className="rv-header">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">Finance</p>
          <h1 className="rv-title">Revenue</h1>
        </div>
        <button
          className="rv-payout-btn"
          onClick={() => { setShowPayout(true); setPayoutSuccess(false); setPayoutError(null); }}
        >
          💸 Request Payout
        </button>
      </div>

      {payoutSuccess && (
        <div className="rv-success">✅ Payout request submitted! We'll process it shortly.</div>
      )}

      {/* Stats cards */}
      <div className="rv-stats">
        <div className="rv-stat rv-stat--blue">
          <p className="rv-stat__label">Available Balance</p>
          <p className="rv-stat__value">${Number(wallet?.balance ?? 0).toFixed(2)}</p>
          <p className="rv-stat__sub">{wallet?.currency ?? "USD"}</p>
        </div>
        <div className="rv-stat rv-stat--amber">
          <p className="rv-stat__label">Pending Balance</p>
          <p className="rv-stat__value">${Number(wallet?.pending_balance ?? 0).toFixed(2)}</p>
          <p className="rv-stat__sub">Processing</p>
        </div>
        <div className="rv-stat rv-stat--green">
          <p className="rv-stat__label">Total Earned</p>
          <p className="rv-stat__value">${Number(earnings?.total ?? 0).toFixed(2)}</p>
          <p className="rv-stat__sub">All time</p>
        </div>
        <div className="rv-stat rv-stat--teal">
          <p className="rv-stat__label">This Month</p>
          <p className="rv-stat__value">${Number(earnings?.this_month ?? 0).toFixed(2)}</p>
          <p className="rv-stat__sub">Current month</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {(["overview", "payouts"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 px-1 text-[14px] font-semibold capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {t === "overview" ? "Overview" : "Payout history"}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === "overview" && (
        <>
          {earnings?.monthly_trend && earnings.monthly_trend.length > 0 && (
            <div className="rv-card">
              <h3 className="rv-card__title">Monthly Earnings Trend</h3>
              <div className="rv-chart">
                {earnings.monthly_trend.map((t) => (
                  <div key={t.month} className="rv-chart__col">
                    <span className="rv-chart__val">${Number(t.amount).toFixed(0)}</span>
                    <div
                      className="rv-chart__bar"
                      style={{ height: `${Math.max(4, (Number(t.amount) / maxTrend) * 140)}px` }}
                    />
                    <span className="rv-chart__month">{t.month}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rv-card">
            <h3 className="rv-card__title">Transaction History</h3>
            {txns.length === 0 ? (
              <p className="rv-empty">No transactions yet.</p>
            ) : (
              <table className="rv-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {txns.map((t) => (
                    <tr key={t.id}>
                      <td>{t.description}</td>
                      <td><span className={`rv-type rv-type--${t.type}`}>{t.type}</span></td>
                      <td className={t.type === "payout" ? "rv-amount--out" : "rv-amount--in"}>
                        {t.type === "payout" ? "-" : "+"}${Number(t.amount).toFixed(2)}
                      </td>
                      <td><span className={`rv-status rv-status--${t.status}`}>{t.status}</span></td>
                      <td>{new Date(t.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── PAYOUT HISTORY TAB ── */}
      {tab === "payouts" && (
        <div className="rv-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="rv-card__title" style={{ marginBottom: 0 }}>Payout requests</h3>
            <button
              className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue-700"
              onClick={() => { setShowPayout(true); setPayoutSuccess(false); setPayoutError(null); }}
            >
              + New request
            </button>
          </div>

          {downloadError && (
            <div className="rv-error mb-3">⚠ {downloadError}</div>
          )}

          {loadingPayouts ? (
            <div className="rv-loading" style={{ minHeight: 120 }}><div className="rv-spinner" /></div>
          ) : payouts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 dark:bg-slate-700">
                <span className="text-2xl">💸</span>
              </div>
              <p className="text-[14px] font-semibold text-slate-600 dark:text-slate-300">No payout requests yet</p>
              <p className="text-[13px] text-slate-400">Request a payout when your balance is ready.</p>
              <button
                className="mt-1 flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue-700"
                onClick={() => { setShowPayout(true); setPayoutSuccess(false); }}
              >
                Request payout <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <>
              <table className="rv-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Requested</th>
                    <th>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p, i) => (
                    <tr key={p.id}>
                      <td className="text-[12px] text-slate-400">#{(payoutsPage - 1) * 15 + i + 1}</td>
                      <td className="font-semibold ink">${Number(p.amount).toFixed(2)}</td>
                      <td className="capitalize text-[13px]">{p.payment_method.replace("_", " ")}</td>
                      <td>
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-bold capitalize ${STATUS_STYLES[p.status] ?? ""}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="text-[13px] text-slate-500">
                        {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td>
                        {p.status === "approved" && p.receipt_id ? (
                          <button
                            onClick={() => handleDownloadReceipt(p)}
                            disabled={downloadingId === p.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[12px] font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400"
                          >
                            {downloadingId === p.id
                              ? <span className="rv-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                              : <Download className="h-3.5 w-3.5" />}
                            {downloadingId === p.id ? "…" : "PDF"}
                          </button>
                        ) : p.status === "pending" ? (
                          <span className="text-[12px] text-slate-400">Pending</span>
                        ) : p.status === "rejected" ? (
                          <span className="text-[12px] text-rose-400">—</span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {payoutsLastPage > 1 && (
                <div className="mt-4 flex items-center justify-center gap-3 text-[13px]">
                  <button
                    disabled={payoutsPage <= 1}
                    onClick={() => fetchPayouts(payoutsPage - 1)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                  >
                    ← Prev
                  </button>
                  <span className="text-slate-400">Page {payoutsPage} of {payoutsLastPage}</span>
                  <button
                    disabled={payoutsPage >= payoutsLastPage}
                    onClick={() => fetchPayouts(payoutsPage + 1)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Payout modal */}
      {showPayout && (
        <div className="rv-modal-overlay" onClick={() => setShowPayout(false)}>
          <div className="rv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rv-modal__head">
              <h3>Request Payout</h3>
              <button className="rv-modal__close" onClick={() => setShowPayout(false)}>✕</button>
            </div>

            <p className="rv-modal__balance">
              Available: <strong>${Number(wallet?.balance ?? 0).toFixed(2)}</strong>
            </p>

            {payoutError && <div className="rv-error">⚠ {payoutError}</div>}

            <div className="rv-modal__field">
              <label>Amount (USD)</label>
              <div className="rv-modal__input-wrap">
                <span>$</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
            </div>

            <div className="rv-modal__field">
              <label>Payment Method</label>
              <div className="rv-methods">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.value}
                    className={`rv-method${payoutForm.payment_method === m.value ? " rv-method--active" : ""}`}
                    onClick={() => setPayoutForm((f) => ({ ...f, payment_method: m.value }))}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rv-modal__actions">
              <button className="rv-modal__cancel" onClick={() => setShowPayout(false)}>Cancel</button>
              <button className="rv-modal__submit" onClick={handlePayout} disabled={payoutSaving}>
                {payoutSaving ? "Submitting…" : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
