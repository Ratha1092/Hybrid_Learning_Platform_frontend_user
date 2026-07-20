import { Check, ArrowRight, Wallet, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Reveal } from "../../utils/anim";
import { usePlatformStats } from "../../utils/usePlatformStats";

export default function BecomeInstructor() {
  const stats = usePlatformStats();
  const students = stats?.total_students ?? 0;
  const topEarnings = stats?.top_instructor_monthly_earnings ?? 0;

  const perks = [
    students > 0
      ? `Reach a global audience of ${students.toLocaleString()}+ learners`
      : "Reach a growing global audience of learners",
    "Secure monthly payouts & transparent revenue reports",
    "Powerful analytics dashboard for every course",
    "Dedicated instructor success & marketing support",
  ];

  return (
    <section className="bg-[#EEF1F6] dark:bg-slate-900 py-16 sm:py-20">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="grad-navy relative overflow-hidden rounded-[32px] px-6 py-12 shadow-soft-dark sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="grid items-center gap-12 md:grid-cols-2">

            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full glass-dark px-3.5 py-1.5 text-[13px] font-semibold text-blue-200">
                <Wallet className="h-3.5 w-3.5" /> Instructor Marketplace
              </span>
              <h2 className="mt-5 font-display text-[32px] font-extrabold leading-tight text-white sm:text-[42px]">
                Turn your knowledge into income
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-slate-300">
                Publish courses on our marketplace and earn monthly from a global
                community of motivated learners.
              </p>
              <ul className="mt-7 space-y-3">
                {perks.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-[14.5px] text-slate-200">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/20">
                      <Check className="h-3 w-3 text-emerald-400" strokeWidth={3} />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
              <Link
                to="/instructor/register"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-glow"
              >
                Start Teaching <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>

            <Reveal delay={140} className="relative hidden md:block">
              <div className="relative mx-auto max-w-sm">
                <img
                  src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=700&q=75"
                  alt="Instructor teaching"
                  className="h-72 w-full rounded-2xl object-cover shadow-soft-dark dark:brightness-[0.65] dark:contrast-[0.95] transition-[filter] duration-300"
                />
                <div className="animate-floaty absolute -left-24 top-10 z-10 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-card backdrop-blur-md dark:bg-slate-800 dark:ring-1 dark:ring-slate-600">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                  </span>
                  <div className="leading-tight">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Monthly earnings</p>
                    <p className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
                      {topEarnings > 0 ? `$${Math.round(topEarnings).toLocaleString()}` : "—"}
                    </p>
                  </div>
                </div>
                <div className="animate-floaty2 absolute -bottom-5 -right-8 z-10 rounded-2xl bg-white/95 px-4 py-3 shadow-card backdrop-blur-md dark:bg-slate-800 dark:ring-1 dark:ring-slate-600">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Active students</p>
                  <p className="font-display text-lg font-extrabold text-slate-900 dark:text-white">{students > 0 ? students.toLocaleString() : "—"}</p>
                </div>
              </div>
            </Reveal>

          </div>
        </div>
      </div>
    </section>
  );
}
