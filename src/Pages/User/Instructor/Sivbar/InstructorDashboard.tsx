import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import {
  instructorService,
  type DashboardStats,
  type EarningsData,
  type MonthlyTrend,
  type InstructorCourse,
} from "../../../../services/instructorService";
import "../css/InstructorDashboard.css";

function greeting(name: string) {
  const h = new Date().getHours();
  const period = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return `${period}, ${name}!`;
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const FALLBACK_BARS: MonthlyTrend[] = [
  { month: "Feb", amount: 2400 },
  { month: "Mar", amount: 3100 },
  { month: "Apr", amount: 2800 },
  { month: "May", amount: 4200 },
  { month: "Jun", amount: 3900 },
  { month: "Jul", amount: 5200 },
];

export default function InstructorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      instructorService.getDashboard(),
      instructorService.getEarnings().catch(() => null),
      instructorService.getMyCourses().catch(() => null),
    ])
      .then(([dashRes, earnRes, courseRes]) => {
        setData(dashRes.data.data);
        if (earnRes) setEarnings(earnRes.data.data);
        if (courseRes) setCourses(courseRes.data.data.slice(0, 4));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const firstName = (user?.name ?? "Instructor").split(" ").pop() ?? "Instructor";

  if (loading) {
    return (
      <div className="id2-state">
        <div className="id2-spinner" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="id2-state id2-state--err">
        <p>Failed to load dashboard.</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const bars =
    earnings?.monthly_trend && earnings.monthly_trend.length > 0
      ? earnings.monthly_trend.slice(-6)
      : FALLBACK_BARS;
  const maxBar = Math.max(...bars.map((b) => b.amount), 1);

  const TILES = [
    {
      label: "Total Revenue",
      value: `$${Number(data.revenue.total_earned).toLocaleString("en-US", { minimumFractionDigits: 0 })}`,
      delta: earnings ? `$${Number(earnings.this_month).toLocaleString()} this month` : "total earned",
      tint: "emerald" as const,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" />
        </svg>
      ),
    },
    {
      label: "Total Students",
      value: data.students.total_unique.toLocaleString(),
      delta: "unique learners",
      tint: "blue" as const,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: "Published Courses",
      value: data.courses.published,
      delta: `${data.courses.draft} draft${data.courses.draft !== 1 ? "s" : ""}`,
      tint: "violet" as const,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 5.5C7 5 9.5 5.4 12 7c2.5-1.6 5-2 8-1.5V18c-3-.5-5.5-.1-8 1.5-2.5-1.6-5-2-8-1.5Z" />
        </svg>
      ),
    },
    {
      label: "Total Courses",
      value: data.courses.total,
      delta: `${data.courses.published} published`,
      tint: "amber" as const,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5L7.2 17l.9-5.4L4.2 9.7l5.4-.8L12 4Z" />
        </svg>
      ),
    },
  ];

  const TINT_MAP = {
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    blue:    "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    violet:  "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400",
    amber:   "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
  };

  return (
    <div className="flex flex-col gap-6">

      {/* ── Section header ── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
          Instructor
        </p>
        <h1 className="mt-1 font-display text-[1.9rem] font-bold leading-tight ink dark:text-slate-50">
          {greeting(firstName)}
        </h1>
        <p className="mt-1 text-sm muted2 dark:text-slate-400">
          Track your performance and manage your courses.
        </p>
      </div>

      {/* ── 4 stat tiles ── */}
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-e1 dark:border-slate-700 dark:bg-slate-800 sm:grid-cols-2 sm:p-3 lg:grid-cols-4">
        {TILES.map((t, i) => (
          <div
            key={t.label}
            className={`flex items-center gap-4 rounded-xl p-4${
              i < TILES.length - 1
                ? " border-b border-slate-100 dark:border-slate-700 sm:border-b-0 sm:border-r last:border-0"
                : ""
            }`}
          >
            <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${TINT_MAP[t.tint]}`}>
              <span className="block h-5 w-5">{t.icon}</span>
            </div>
            <div className="min-w-0">
              <div className="font-display text-[1.45rem] font-extrabold leading-none ink dark:text-slate-50">
                {t.value}
              </div>
              <div className="mt-0.5 text-[11.5px] font-semibold muted2 dark:text-slate-400">{t.label}</div>
              <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">{t.delta}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Revenue chart + Recent enrollments ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">

        {/* Revenue overview */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-[15px] font-bold ink dark:text-slate-100">Revenue overview</p>
              <p className="text-[12.5px] muted2 dark:text-slate-400">Last {bars.length} months</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11.5px] font-bold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
              {earnings
                ? `$${Number(earnings.total).toLocaleString()}`
                : `$${Number(data.revenue.total_earned).toLocaleString()}`}
            </span>
          </div>

          {/* Bar chart */}
          <div className="mt-6 flex h-52 items-end gap-2">
            {bars.map((b, i) => (
              <div key={b.month || i} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      i === bars.length - 1
                        ? "grad-blue"
                        : "bg-blue-200 dark:bg-blue-900/40"
                    }`}
                    style={{ height: `${(b.amount / maxBar) * 100}%`, minHeight: "4px" }}
                    title={`$${b.amount.toLocaleString()}`}
                  />
                </div>
                <span className="text-[10.5px] muted2 dark:text-slate-500">{b.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent enrollments */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <p className="font-display text-[15px] font-bold ink dark:text-slate-100">Recent enrollments</p>
            <button
              className="text-[11px] font-bold uppercase tracking-widest text-blue-600 hover:underline dark:text-blue-400"
              onClick={() => navigate("/instructor/students")}
            >
              See all
            </button>
          </div>

          {data.recent_enrollments.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
              <svg
                className="h-10 w-10 text-slate-300 dark:text-slate-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              <p className="text-sm muted2 dark:text-slate-500">No enrollments yet</p>
            </div>
          ) : (
            <div className="mt-4 flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              {data.recent_enrollments.map((e, i) => (
                <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-50 text-[14px] font-bold text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                    {e.student_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold ink dark:text-slate-100">
                      {e.student_name}
                    </p>
                    <p className="truncate text-[12px] muted2 dark:text-slate-400">{e.course_title}</p>
                  </div>
                  <span className="shrink-0 text-[11.5px] muted2 dark:text-slate-500">
                    {timeAgo(e.enrolled_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Top courses ── */}
      {courses.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-display text-[15px] font-bold ink dark:text-slate-100">My courses</p>
            <button
              className="text-[11px] font-bold uppercase tracking-widest text-blue-600 hover:underline dark:text-blue-400"
              onClick={() => navigate("/instructor/courses")}
            >
              Manage →
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {courses.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-4 rounded-xl border border-slate-200 p-3 dark:border-slate-700"
              >
                {c.thumbnail_url ? (
                  <img
                    src={c.thumbnail_url}
                    alt={c.title}
                    className="h-14 w-20 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="grid h-14 w-20 shrink-0 place-items-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <svg
                      className="h-6 w-6 text-blue-300 dark:text-blue-700"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 5.5C7 5 9.5 5.4 12 7c2.5-1.6 5-2 8-1.5V18c-3-.5-5.5-.1-8 1.5-2.5-1.6-5-2-8-1.5Z" />
                    </svg>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[14.5px] font-bold ink dark:text-slate-100">
                    {c.title}
                  </p>
                  <p className="text-[12.5px] muted2 dark:text-slate-400">
                    {c.students_count ?? 0} students ·{" "}
                    <span className="capitalize">{c.status}</span>
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-[15px] font-extrabold ink dark:text-slate-100">
                    ${parseFloat(c.price).toLocaleString("en-US", { minimumFractionDigits: 0 })}
                  </p>
                  <p className="text-[11px] capitalize text-slate-400 dark:text-slate-500">{c.level}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
