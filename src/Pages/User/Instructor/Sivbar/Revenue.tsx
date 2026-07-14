import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DollarSign, Wallet, Clock, TrendingUp, TrendingDown, Download, X, ArrowUpRight, CheckCircle, AlertCircle } from "lucide-react";
import {
  instructorService,
  type WalletData,
  type EarningsData,
  type Transaction,
  type PayoutRequest,
  type InstructorPayoutAccount,
} from "../../../../services/instructorService";

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending:  { label: "Pending",  cls: "bg-amber-50 text-amber-600 ring-1 ring-amber-200" },
  approved: { label: "Paid",     cls: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200" },
  rejected: { label: "Rejected", cls: "bg-rose-50 text-rose-600 ring-1 ring-rose-200" },
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function fmtK(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"
      style={{ width: size, height: size }}
    />
  );
}

export default function Revenue() {
  const [wallet, setWallet]           = useState<WalletData | null>(null);
  const [earnings, setEarnings]       = useState<EarningsData | null>(null);
  const [txns, setTxns]               = useState<Transaction[]>([]);
  const [payoutAccount, setPayoutAccount] = useState<InstructorPayoutAccount | null>(null);
  const [loading, setLoading]         = useState(true);
  const [apiError, setApiError]       = useState(false);

  const [payouts, setPayouts]               = useState<PayoutRequest[]>([]);
  const [payoutsPage, setPayoutsPage]       = useState(1);
  const [payoutsLastPage, setPayoutsLastPage] = useState(1);
  const [loadingPayouts, setLoadingPayouts] = useState(false);

  const [showPayout, setShowPayout]       = useState(false);
  const [payoutForm, setPayoutForm]       = useState({ amount: "" });
  const [payoutSaving, setPayoutSaving]   = useState(false);
  const [payoutError, setPayoutError]     = useState<string | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      instructorService.getWallet(),
      instructorService.getEarnings(),
      instructorService.getTransactions(),
      instructorService.getPayoutAccount(),
    ])
      .then(([w, e, t, a]) => {
        setWallet(w.data.data);
        setEarnings(e.data.data);
        setTxns(Array.isArray(t.data.data) ? t.data.data : []);
        setPayoutAccount(a.data.data);
      })
      .catch(() => setApiError(true))
      .finally(() => setLoading(false));
    fetchPayouts(1);
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

  const canPayout = payoutAccount?.status === "verified";

  const handlePayout = async () => {
    if (!payoutForm.amount || Number(payoutForm.amount) <= 0) {
      setPayoutError("Please enter a valid amount."); return;
    }
    setPayoutSaving(true); setPayoutError(null);
    try {
      await instructorService.requestPayout({
        amount: Number(payoutForm.amount),
      });
      setPayoutSuccess(true);
      setShowPayout(false);
      setPayoutForm({ amount: "" });
      const w = await instructorService.getWallet();
      setWallet(w.data.data);
      fetchPayouts(1);
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

  const openPayout = () => { setShowPayout(true); setPayoutSuccess(false); setPayoutError(null); };

  const trend  = earnings?.monthly_trend ?? [];
  const maxVal = trend.reduce((m, t) => Math.max(m, Number(t.amount)), 1);
  const growthPct = trend.length >= 2
    ? Math.round(((Number(trend[trend.length - 1].amount) - Number(trend[0].amount)) / Math.max(1, Number(trend[0].amount))) * 100)
    : null;

  if (loading) return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner size={36} />
    </div>
  );

  if (apiError) return (
    <div className="max-w-2xl">
      <h1 className="mb-1 font-display text-[28px] font-extrabold text-slate-900 dark:text-white">Revenue</h1>
      <p className="text-[14px] text-slate-500">Track your earnings and payouts.</p>
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto mb-3 text-4xl">💰</div>
        <p className="text-[15px] font-bold text-slate-700 dark:text-slate-200">Revenue data unavailable</p>
        <p className="mt-1 text-[13px] text-slate-400">The finance API is not accessible. Please contact the backend team.</p>
      </div>
    </div>
  );

  return (
    <div className="flex max-w-[940px] flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-extrabold text-slate-900 dark:text-white">Revenue</h1>
          <p className="mt-0.5 text-[14px] text-slate-500 dark:text-slate-400">Track your earnings and payouts.</p>
        </div>
        <div className="group relative shrink-0">
          <button
            onClick={openPayout}
            disabled={!canPayout}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <DollarSign className="h-4 w-4" /> Request Payout
          </button>
          {!canPayout && (
            <div className="pointer-events-none absolute right-0 top-full z-10 mt-2 w-56 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[12px] text-slate-600 opacity-0 shadow-card transition-opacity group-hover:opacity-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {!payoutAccount
                ? "Set up and verify a payout account first."
                : payoutAccount.status === "pending"
                ? "Waiting for admin to verify your payout account."
                : "Your payout account was rejected. Please update it."}
            </div>
          )}
        </div>
      </div>

      {/* ── Payout account status strip ── */}
      {!payoutAccount ? (
        <Link
          to="/instructor/payout-account"
          className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5 transition-colors hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:hover:bg-amber-500/15"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-[13.5px] font-semibold text-amber-700 dark:text-amber-300">
              Set up a payout account before requesting withdrawals.
            </p>
          </div>
          <span className="shrink-0 text-[12.5px] font-semibold text-amber-600 dark:text-amber-400">
            Set up →
          </span>
        </Link>
      ) : payoutAccount.status === "pending" ? (
        <Link
          to="/instructor/payout-account"
          className="flex items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3.5 transition-colors hover:bg-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:hover:bg-blue-500/15"
        >
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <p className="text-[13.5px] font-semibold text-blue-700 dark:text-blue-300">
              Payout account pending admin verification.
            </p>
          </div>
          <span className="shrink-0 text-[12.5px] font-semibold text-blue-600 dark:text-blue-400">
            View →
          </span>
        </Link>
      ) : payoutAccount.status === "rejected" ? (
        <Link
          to="/instructor/payout-account"
          className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3.5 transition-colors hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:hover:bg-rose-500/15"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <p className="text-[13.5px] font-semibold text-rose-700 dark:text-rose-300">
              Payout account rejected — please update your details.
            </p>
          </div>
          <span className="shrink-0 text-[12.5px] font-semibold text-rose-600 dark:text-rose-400">
            Fix →
          </span>
        </Link>
      ) : (
        <Link
          to="/instructor/payout-account"
          className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 transition-colors hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/15"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <p className="text-[13.5px] font-semibold text-emerald-700 dark:text-emerald-300">
              <span className="capitalize">{payoutAccount.method.replace("_", " ")}</span>
              {payoutAccount.account_name && ` · ${payoutAccount.account_name}`}
              {payoutAccount.phone_number && ` · ${payoutAccount.phone_number}`}
              {payoutAccount.account_number && ` · ${payoutAccount.account_number}`}
            </p>
          </div>
          <span className="shrink-0 text-[12.5px] font-semibold text-emerald-600 dark:text-emerald-400">
            Manage →
          </span>
        </Link>
      )}

      {payoutSuccess && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13.5px] font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
          ✅ Payout request submitted! We'll process it within 1–3 business days.
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/15">
            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="font-display text-[26px] font-extrabold text-slate-900 dark:text-white">
            ${fmt(Number(wallet?.balance ?? 0))}
          </p>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">Available balance</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-500/15">
            <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="font-display text-[26px] font-extrabold text-slate-900 dark:text-white">
            ${fmt(Number(earnings?.total ?? 0))}
          </p>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">Lifetime earnings</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/15">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="font-display text-[26px] font-extrabold text-slate-900 dark:text-white">
            ${fmt(Number(wallet?.pending_balance ?? 0))}
          </p>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">Pending payout</p>
        </div>
      </div>

      {/* ── Earnings chart ── */}
      {trend.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
              Earnings · last {trend.length} months
            </h3>
            {growthPct !== null && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold ${
                growthPct >= 0
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
              }`}>
                {growthPct >= 0
                  ? <TrendingUp className="h-3 w-3" />
                  : <TrendingDown className="h-3 w-3" />}
                {growthPct >= 0 ? "+" : ""}{growthPct}%
              </span>
            )}
          </div>

          <div className="flex items-end gap-2 border-b border-slate-100 pb-3 dark:border-slate-700" style={{ height: 200 }}>
            {trend.map((t) => {
              const barH = Math.max(6, (Number(t.amount) / maxVal) * 148);
              return (
                <div key={t.month} className="group flex flex-1 flex-col items-center gap-1.5 justify-end">
                  <span className="text-[10px] font-semibold text-slate-400 transition-colors group-hover:text-blue-600 dark:text-slate-500 dark:group-hover:text-blue-400">
                    {fmtK(Number(t.amount))}
                  </span>
                  <div
                    className="w-full max-w-12 rounded-t-lg bg-slate-100 transition-colors group-hover:bg-blue-500 dark:bg-slate-700 dark:group-hover:bg-blue-500"
                    style={{ height: barH }}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-2 flex gap-2">
            {trend.map((t) => (
              <div key={t.month} className="flex flex-1 justify-center">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">{t.month}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Payout history ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-e1 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-700">
          <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">Payout history</h3>
          <div className="flex items-center gap-3">
            {downloadError && (
              <span className="text-[12px] text-rose-500">{downloadError}</span>
            )}
            <button
              onClick={openPayout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-slate-600 shadow-e1 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:border-blue-400 dark:hover:text-blue-400"
            >
              <DollarSign className="h-3.5 w-3.5" /> Request Payout
            </button>
          </div>
        </div>

        {loadingPayouts ? (
          <div className="flex items-center justify-center py-14">
            <Spinner />
          </div>
        ) : payouts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 dark:bg-slate-700">
              <DollarSign className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-[14px] font-semibold text-slate-600 dark:text-slate-300">No payout requests yet</p>
            <p className="text-[13px] text-slate-400">Request a payout when your balance is ready.</p>
            <button
              onClick={openPayout}
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-blue-700"
            >
              Request payout <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13.5px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    {["Date", "Method", "Amount", "Status", ""].map((h) => (
                      <th
                        key={h}
                        className={`px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 ${h === "" ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => {
                    const cfg = STATUS_CFG[p.status] ?? { label: p.status, cls: "bg-slate-50 text-slate-500 ring-1 ring-slate-200" };
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-700/50 dark:hover:bg-slate-700/30"
                      >
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                          {new Date(p.created_at).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 capitalize text-slate-500 dark:text-slate-400">
                          {p.payment_method.replace(/_/g, " ")}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                          ${fmt(Number(p.amount))}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold capitalize ${cfg.cls}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {p.status === "approved" && p.receipt_id ? (
                            <button
                              onClick={() => handleDownloadReceipt(p)}
                              disabled={downloadingId === p.id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[12px] font-semibold text-blue-600 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400"
                            >
                              {downloadingId === p.id ? <Spinner size={14} /> : <Download className="h-3.5 w-3.5" />}
                              PDF
                            </button>
                          ) : (
                            <span className="text-[12px] text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {payoutsLastPage > 1 && (
              <div className="flex items-center justify-center gap-3 border-t border-slate-100 py-4 text-[13px] dark:border-slate-700">
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

      {/* ── Transaction history (recent activity) ── */}
      {txns.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-e1 dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-700">
            <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">Recent transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13.5px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  {["Description", "Type", "Amount", "Date"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {txns.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-700/50 dark:hover:bg-slate-700/30"
                  >
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{t.description}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold capitalize ${
                        t.type === "payout"
                          ? "bg-amber-50 text-amber-600 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400"
                          : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400"
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-semibold ${
                      t.type === "payout"
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {t.type === "payout" ? "−" : "+"}${fmt(Number(t.amount))}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {new Date(t.created_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Payout request modal ── */}
      {showPayout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => setShowPayout(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-2xl dark:border-slate-700 dark:bg-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h3 className="font-display text-[18px] font-extrabold text-slate-900 dark:text-white">Request Payout</h3>
                <p className="mt-0.5 text-[12.5px] text-slate-500 dark:text-slate-400">Funds transferred within 1–3 business days</p>
              </div>
              <button
                onClick={() => setShowPayout(false)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Balance info */}
            <div className="mb-5 space-y-2 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-700/50">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-slate-500 dark:text-slate-400">Available balance</span>
                <span className="font-bold text-slate-900 dark:text-white">${fmt(Number(wallet?.balance ?? 0))}</span>
              </div>
              {Number(wallet?.pending_balance ?? 0) > 0 && (
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-slate-500 dark:text-slate-400">Pending (not withdrawable)</span>
                  <span className="font-semibold text-amber-600">${fmt(Number(wallet.pending_balance))}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-[13px] dark:border-slate-600">
                <span className="text-slate-500 dark:text-slate-400">Currency</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{wallet?.currency ?? "USD"}</span>
              </div>
            </div>

            {payoutError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                ⚠ {payoutError}
              </div>
            )}

            {/* Amount */}
            <div className="mb-4">
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                Amount (USD)
              </label>
              <div className="flex overflow-hidden rounded-xl border border-slate-200 transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-slate-600">
                <span className="flex items-center border-r border-slate-200 bg-slate-50 px-3.5 text-[14px] font-bold text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm((f) => ({ ...f, amount: e.target.value }))}
                  className="flex-1 bg-transparent px-3.5 py-3 text-[14px] text-slate-900 outline-none placeholder:text-slate-300 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setPayoutForm((f) => ({ ...f, amount: String(Number(wallet?.balance ?? 0).toFixed(2)) }))}
                  className="border-l border-slate-200 bg-slate-50 px-3.5 text-[11.5px] font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:border-slate-600 dark:bg-slate-700 dark:text-blue-400 dark:hover:bg-blue-500/10"
                >
                  Max
                </button>
              </div>
              <p className="mt-1.5 text-[11.5px] text-slate-400">
                Maximum: ${fmt(Number(wallet?.balance ?? 0))}
              </p>
            </div>

            {/* Payment method info (read-only from verified account) */}
            {payoutAccount && (
              <div className="mb-6 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-700/40">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Paid via</p>
                <p className="text-[13px] font-semibold capitalize text-slate-700 dark:text-slate-200">
                  {payoutAccount.method.replace("_", " ")}
                  {payoutAccount.account_name && ` · ${payoutAccount.account_name}`}
                  {payoutAccount.phone_number && ` · ${payoutAccount.phone_number}`}
                  {payoutAccount.account_number && ` · ${payoutAccount.account_number}`}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowPayout(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-[13.5px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handlePayout}
                disabled={payoutSaving}
                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {payoutSaving ? "Submitting…" : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
