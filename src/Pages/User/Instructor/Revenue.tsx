import { useEffect, useState } from "react";
import {
  instructorService,
  type WalletData,
  type EarningsData,
  type Transaction,
} from "../../../services/instructorService";
import "./Revenue.css";

const PAYMENT_METHODS = [
  { value: "bank",   label: "🏦 Bank Transfer" },
  { value: "momo",   label: "📱 MOMO" },
  { value: "acleda", label: "🏧 ACLEDA" },
  { value: "wing",   label: "🦋 Wing" },
];

export default function Revenue() {
  const [wallet, setWallet]       = useState<WalletData | null>(null);
  const [earnings, setEarnings]   = useState<EarningsData | null>(null);
  const [txns, setTxns]           = useState<Transaction[]>([]);
  const [loading, setLoading]     = useState(true);
  const [apiError, setApiError]   = useState(false);
  const [showPayout, setShowPayout] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ amount: "", payment_method: "bank" });
  const [payoutSaving, setPayoutSaving] = useState(false);
  const [payoutError, setPayoutError]   = useState<string | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  useEffect(() => {
    Promise.all([
      instructorService.getWallet(),
      instructorService.getEarnings(),
      instructorService.getTransactions(),
    ])
      .then(([w, e, t]) => {
        setWallet(w.data.data);
        setEarnings(e.data.data);
        const rawTxns = t.data.data;
        setTxns(Array.isArray(rawTxns) ? rawTxns : []);
      })
      .catch(() => { setApiError(true); })
      .finally(() => setLoading(false));
  }, []);

  const handlePayout = async () => {
    if (!payoutForm.amount || Number(payoutForm.amount) <= 0) {
      setPayoutError("Please enter a valid amount.");
      return;
    }
    setPayoutSaving(true);
    setPayoutError(null);
    try {
      await instructorService.requestPayout({
        amount: Number(payoutForm.amount),
        payment_method: payoutForm.payment_method,
      });
      setPayoutSuccess(true);
      setShowPayout(false);
      setPayoutForm({ amount: "", payment_method: "bank" });
      const w = await instructorService.getWallet();
      setWallet(w.data.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setPayoutError(e.response?.data?.message ?? e.message ?? "Failed to request payout.");
    }
    setPayoutSaving(false);
  };

  const maxTrend = earnings?.monthly_trend?.reduce((m, t) => Math.max(m, Number(t.amount)), 1) ?? 1;

  if (loading) {
    return <div className="rv-loading"><div className="rv-spinner" /></div>;
  }

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
      <div className="rv-header">
        <h1 className="rv-title">Revenue</h1>
        <button className="rv-payout-btn" onClick={() => { setShowPayout(true); setPayoutSuccess(false); setPayoutError(null); }}>
          💸 Request Payout
        </button>
      </div>

      {payoutSuccess && (
        <div className="rv-success">✅ Payout request submitted successfully!</div>
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

      {/* Monthly trend */}
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

      {/* Transactions */}
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
                {payoutSaving ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
