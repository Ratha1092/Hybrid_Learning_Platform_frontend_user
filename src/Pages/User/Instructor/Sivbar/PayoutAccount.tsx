import { useEffect, useState } from "react";
import { CheckCircle, Clock, XCircle, ShieldCheck, Banknote, QrCode } from "lucide-react";
import { instructorService, type InstructorPayoutAccount } from "../../../../services/instructorService";
import PayoutAccountSection from "./PayoutAccountSection";

function Spinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
    </div>
  );
}

const STATUS_CFG = {
  verified: { Icon: CheckCircle, cls: "text-emerald-600 bg-emerald-50 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/30 dark:text-emerald-400", label: "Verified — you can request payouts" },
  pending:  { Icon: Clock,       cls: "text-amber-600 bg-amber-50 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30 dark:text-amber-400",             label: "Pending admin verification" },
  rejected: { Icon: XCircle,     cls: "text-rose-600 bg-rose-50 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:ring-rose-500/30 dark:text-rose-400",                   label: "Rejected — update your details" },
} as const;

export default function PayoutAccount() {
  const [account, setAccount]   = useState<InstructorPayoutAccount | null>(null);
  const [loading, setLoading]   = useState(true);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    instructorService.getPayoutAccount()
      .then((res) => setAccount(res.data.data))
      .catch((err) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        // Only hard-fail on auth errors; anything else (500, network) → treat as no account
        if (status === 401 || status === 403) setApiError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  if (apiError) return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-[28px] font-extrabold text-slate-900 dark:text-white">Payout Account</h1>
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-800">
        <p className="text-[15px] font-bold text-slate-700 dark:text-slate-200">Could not load account data</p>
        <p className="mt-1 text-[14.5px] text-slate-400">Please refresh or contact support if the problem persists.</p>
      </div>
    </div>
  );

  const statusCfg = account ? STATUS_CFG[account.status] : null;

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-extrabold text-slate-900 dark:text-white">Payout Account</h1>
          <p className="mt-0.5 text-[14px] text-slate-500 dark:text-slate-400">
            Register your payment details. An admin verifies the account before payouts can be processed.
          </p>
        </div>
        {statusCfg && (
          <span className={`mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[14.5px] font-bold ${statusCfg.cls}`}>
            <statusCfg.Icon className="h-3.5 w-3.5" />
            {statusCfg.label}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <PayoutAccountSection account={account} onSaved={(a) => setAccount(a)} />
        </div>
        <div className="flex shrink-0 flex-col gap-4 lg:w-72">

          {/* How it works */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-4 text-[15px] font-bold text-slate-800 dark:text-slate-100">How it works</h3>
            <ol className="space-y-0">
              {[
                { Icon: Banknote,    color: "bg-blue-100 dark:bg-blue-500/15",    icon: "text-blue-600 dark:text-blue-400",    title: "Register",  desc: "Fill in your payment method, account name, and any required details." },
                { Icon: ShieldCheck, color: "bg-amber-100 dark:bg-amber-500/15",  icon: "text-amber-600 dark:text-amber-400",  title: "Verify",    desc: "An admin reviews your account within 1–2 business days." },
                { Icon: QrCode,      color: "bg-emerald-100 dark:bg-emerald-500/15", icon: "text-emerald-600 dark:text-emerald-400", title: "Get paid", desc: "Once verified, request payouts from the Revenue page anytime." },
              ].map(({ Icon, color, icon, title, desc }, i, arr) => (
                <li key={title} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${color}`}>
                      <Icon className={`h-4 w-4 ${icon}`} />
                    </div>
                    {i < arr.length - 1 && (
                      <div className="my-1 w-px flex-1 bg-slate-100 dark:bg-slate-700" style={{ minHeight: 16 }} />
                    )}
                  </div>
                  <div className="pb-4 pt-0.5">
                    <p className="text-[14.5px] font-semibold text-slate-700 dark:text-slate-200">{title}</p>
                    <p className="mt-0.5 text-[14.5px] leading-relaxed text-slate-400 dark:text-slate-500">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Supported methods */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-3 text-[15px] font-bold text-slate-800 dark:text-slate-100">Supported methods</h3>
            <div className="space-y-2.5">
              {[
                { name: "Bank Transfer", note: "Name + account no." },
                { name: "MOMO",          note: "Name + phone" },
                { name: "ACLEDA",        note: "Name + account no." },
                { name: "Wing",          note: "Name + phone" },
                { name: "KHQR",          note: "Name + QR code" },
              ].map(({ name, note }) => (
                <div key={name} className="flex items-center justify-between gap-2">
                  <span className="text-[14.5px] font-semibold text-slate-700 dark:text-slate-200">{name}</span>
                  <span className="text-[14.5px] text-slate-400 dark:text-slate-500">{note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* QR tip */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-[14px] leading-relaxed text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
            <span className="font-semibold">Tip:</span> Uploading a QR code speeds up verification and ensures funds go to exactly the right account.
          </div>
        </div>
      </div>
    </div>
  );
}
