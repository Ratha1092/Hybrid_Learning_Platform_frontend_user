import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  BookOpen, Award, Clock, ArrowRight, Play, Heart,
  Calendar, Mail, Pencil, Users, LogOut, Star,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useWishlist } from "../../../context/WishlistContext";
import type { EnrolledCourse } from "../../../services/courseService";
import { orderService, type Order } from "../../../services/orderService";
import { billingService, type Invoice } from "../../../services/billingService";
import { profileService, type DashboardData } from "../../../services/profileService";
import ProfileLayout from "./ProfileLayout";
import { EditProfilePanel } from "./StudentProfileEdit";
import "./StudentProfile.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
function resolveUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

interface OrderDetail {
  order: Order | null;
  invoice: Invoice | null;
  loadingOrder: boolean;
  loadingInvoice: boolean;
}

async function parseBlobError(err: unknown): Promise<string> {
  const e = err as { response?: { data?: unknown }; message?: string };
  const data = e.response?.data;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text()) as { message?: string };
      return parsed.message ?? "Download failed.";
    } catch { return "Download failed."; }
  }
  if (data && typeof data === "object" && "message" in data)
    return (data as { message?: string }).message ?? "Download failed.";
  return e.message ?? "Download failed.";
}

function greetingFor(name: string) {
  const h = new Date().getHours();
  const period = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  return `Good ${period}, ${name}`;
}

function formatShortDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  }).toUpperCase();
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
function todayKey() {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
}

export default function StudentProfile() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { items: wishlistItems, toggle: wishlistToggle } = useWishlist();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view") ?? "overview";

  const [editMounted, setEditMounted] = useState(false);
  const [studentProfile, setStudentProfile] = useState<DashboardData["profile"] | null>(null);
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState(false);
  const [courseFilter, setCourseFilter] = useState<"inprogress" | "completed" | "all">("inprogress");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLastPage, setOrdersLastPage] = useState(1);

  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<number | null>(null);
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<number | null>(null);
  const [downloadingCnId, setDownloadingCnId] = useState<number | null>(null);
  const [receiptError, setReceiptError] = useState<{ id: number; message: string } | null>(null);
  const [invoiceError, setInvoiceError] = useState<{ id: number; message: string } | null>(null);
  const [cnError, setCnError] = useState<{ id: number; message: string } | null>(null);

  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [orderDetails, setOrderDetails] = useState<Record<number, OrderDetail>>({});

  useEffect(() => { if (!isAuthenticated) navigate("/"); }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    profileService.getDashboard()
      .then(({ data }) => { setStudentProfile(data.data.profile); setCourses(data.data.courses ?? []); })
      .catch(() => setCoursesError(true))
      .finally(() => setLoadingCourses(false));
  }, [isAuthenticated]);

  const fetchOrders = useCallback(async (page: number) => {
    setLoadingOrders(true); setOrdersError(false);
    try {
      const { data } = await orderService.list(page);
      setOrders(data.data.data ?? []);
      setOrdersLastPage(data.data.last_page ?? 1);
      setOrdersPage(data.data.current_page ?? page);
    } catch { setOrdersError(true); }
    setLoadingOrders(false);
  }, []);

  useEffect(() => { if (isAuthenticated) fetchOrders(1); }, [isAuthenticated, fetchOrders]);

  // Mount EditProfilePanel once on first visit, then keep alive (hidden) to avoid re-fetching
  useEffect(() => { if (view === "edit") setEditMounted(true); }, [view]);

  const toggleOrderDetail = async (order: Order) => {
    if (expandedOrderId === order.id) { setExpandedOrderId(null); return; }
    setExpandedOrderId(order.id);
    if (orderDetails[order.id]) return;
    setOrderDetails(prev => ({ ...prev, [order.id]: { order: null, invoice: null, loadingOrder: true, loadingInvoice: !!order.invoice_id } }));
    const [orderResult, invoiceResult] = await Promise.allSettled([
      orderService.get(order.id),
      order.invoice_id ? billingService.getInvoice(order.invoice_id) : Promise.resolve(null),
    ]);
    setOrderDetails(prev => ({
      ...prev,
      [order.id]: {
        order: orderResult.status === "fulfilled" ? orderResult.value.data.data : null,
        invoice: invoiceResult.status === "fulfilled" && invoiceResult.value ? invoiceResult.value.data.data : null,
        loadingOrder: false,
        loadingInvoice: false,
      },
    }));
  };

  const handleDownloadInvoice = async (order: Order) => {
    if (!order.invoice_id || !order.invoice_number) return;
    setDownloadingInvoiceId(order.id); setInvoiceError(null);
    try { await billingService.downloadInvoice(order.invoice_id, order.invoice_number); }
    catch (err) { setInvoiceError({ id: order.id, message: await parseBlobError(err) }); }
    setDownloadingInvoiceId(null);
  };

  const handleDownloadReceipt = async (order: Order) => {
    if (!order.receipt_id || !order.receipt_number) return;
    setDownloadingReceiptId(order.id); setReceiptError(null);
    try { await billingService.downloadBillingReceipt(order.receipt_id, order.receipt_number); }
    catch (err) { setReceiptError({ id: order.id, message: await parseBlobError(err) }); }
    setDownloadingReceiptId(null);
  };

  const handleDownloadCreditNote = async (order: Order, cnId: number, cnNumber: string) => {
    setDownloadingCnId(order.id); setCnError(null);
    try { await billingService.downloadInvoice(cnId, cnNumber); }
    catch (err) { setCnError({ id: order.id, message: await parseBlobError(err) }); }
    setDownloadingCnId(null);
  };

  const avatarSrc = resolveUrl(studentProfile?.avatar ?? studentProfile?.avatar_url ?? user?.avatar_url ?? user?.avatar);
  const displayName = studentProfile?.name || user?.name || "Learner";
  const firstName = displayName.split(" ")[0];
  const enrolledCount = courses.length;
  const completedCount = courses.filter(c => c.progress_percentage >= 100).length;
  const today = todayKey();

  const filteredCourses = courseFilter === "inprogress"
    ? courses.filter(c => c.progress_percentage < 100)
    : courseFilter === "completed"
      ? courses.filter(c => c.progress_percentage >= 100)
      : courses;

  const activeLabel =
    view === "courses"      ? "My courses"   :
    view === "orders"       ? "Orders"       :
    view === "wishlist"     ? "Wishlist"     :
    view === "certificates" ? "Certificates" :
    view === "reviews"      ? "Reviews"      :
    view === "settings"     ? "Settings"     :
    view === "edit"         ? "Profile"      :
    "Overview";

  /* ── Profile card (overview only) ── */
  const profileCard = (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-e1 dark:border-slate-700 dark:bg-slate-800">
      <div className="mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-2xl grad-blue text-3xl font-extrabold text-white shadow-glow">
        {avatarSrc
          ? <img src={avatarSrc} alt={displayName} className="h-full w-full object-cover" />
          : displayName.charAt(0).toUpperCase()}
      </div>
      <p className="mt-4 font-display text-[18px] font-bold ink dark:text-slate-50">{displayName}</p>
      <span className="mt-1.5 inline-block rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
        Student
      </span>

      <ul className="mt-5 space-y-2 text-left text-[13px] muted2 dark:text-slate-400">
        {user?.created_at && (
          <li className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0" />
            Joined {new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </li>
        )}
        {user?.email && (
          <li className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0" />
            <span className="break-all">{user.email}</span>
          </li>
        )}
      </ul>

      <div className="mt-5 grid grid-cols-2 divide-x divide-slate-200 border-y border-slate-200 py-4 dark:divide-slate-700 dark:border-slate-700">
        <div className="text-center">
          <p className="font-display text-xl font-extrabold ink dark:text-slate-50">{loadingCourses ? "—" : enrolledCount}</p>
          <p className="text-[12px] muted2 dark:text-slate-400">Enrolled</p>
        </div>
        <div className="text-center">
          <p className="font-display text-xl font-extrabold ink dark:text-slate-50">{loadingCourses ? "—" : completedCount}</p>
          <p className="text-[12px] muted2 dark:text-slate-400">Completed</p>
        </div>
      </div>

      <button
        onClick={() => navigate("/profile/edit")}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5 hover:bg-blue-700"
      >
        <Pencil className="h-4 w-4" /> Edit profile
      </button>

      {user?.role !== "instructor" && user?.instructor_status !== "verified" && user?.instructor_status !== "pending" && (
        <button
          onClick={() => navigate("/instructor/register")}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
        >
          <Users className="h-4 w-4" /> Become an Instructor
        </button>
      )}

      {user?.instructor_status === "pending" && (
        <div className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-400 dark:border-slate-700">
          <Clock className="h-4 w-4" /> Application pending
        </div>
      )}

      <button
        onClick={() => { logout(); navigate("/"); }}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
      >
        <LogOut className="h-4 w-4" /> Log out
      </button>
    </div>
  );

  return (
    <ProfileLayout activeLabel={activeLabel}>
      <div key={view} className="flex min-w-0 flex-col gap-6">

        {/* ══════════════════ OVERVIEW ══════════════════ */}
        {view === "overview" && (
          <>
            {/* Date + greeting row */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">{formatShortDate()}</p>
                <h1 className="mt-0.5 font-display text-[28px] font-extrabold ink dark:text-slate-50 sm:text-[34px]">
                  {greetingFor(firstName)} 👋
                </h1>
                <p className="mt-1 text-[15px] muted2 dark:text-slate-400">Keep going — your next lesson awaits.</p>
              </div>

              {/* Streak card */}
              <div className="shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-[18px]">🔥</span>
                  <span className="font-display text-[14px] font-bold ink dark:text-slate-50">0-day streak</span>
                  <span className="ml-4 text-[12px] muted2 dark:text-slate-400">Best · 0</span>
                </div>
                <div className="mt-3 flex gap-1.5">
                  {DAYS.map(d => (
                    <div key={d} className="flex flex-col items-center gap-1">
                      <div className={`grid h-8 w-8 place-items-center rounded-full text-[11px] font-bold transition-colors ${
                        d === today
                          ? "grad-blue text-white shadow-glow"
                          : "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                      }`}>
                        {d === today ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <circle cx="12" cy="12" r="9" />
                          </svg>
                        ) : null}
                      </div>
                      <span className="text-[10px] muted2 dark:text-slate-500">{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Profile card + panels */}
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
              {/* Profile card */}
              <div className="lg:sticky lg:top-20 lg:self-start">
                {profileCard}
              </div>

              {/* Panels */}
              <div className="flex flex-col gap-6 h-full">
                {/* Continue Learning */}
                <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-[17px] font-bold ink dark:text-slate-100">Continue learning</p>
                    <button
                      onClick={() => navigate("/profile?view=courses")}
                      className="flex items-center gap-1 text-[12px] font-bold uppercase tracking-wide brand-blue transition-all hover:gap-1.5"
                    >
                      View all <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>

                  {loadingCourses ? (
                    <div className="mt-6 flex items-center gap-2 text-[13px] muted2">
                      <div className="pd-spinner" /> Loading…
                    </div>
                  ) : coursesError ? (
                    <p className="mt-4 text-[13px] text-rose-500">Could not load courses.</p>
                  ) : courses.length === 0 ? (
                    <div className="mt-8 flex flex-1 flex-col items-center justify-center rounded-xl bg-slate-50/70 py-10 text-center dark:bg-slate-700/30">
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                        <BookOpen className="h-6 w-6 brand-blue" />
                      </div>
                      <p className="mt-3 text-[14px] muted2 dark:text-slate-400">You haven't enrolled in any courses yet.</p>
                      <button
                        onClick={() => navigate("/courses")}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Browse Courses <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-5 flex flex-col gap-3">
                      {courses.filter(c => c.progress_percentage < 100).slice(0, 3).map(c => {
                        const thumb = resolveUrl(c.course_thumbnail);
                        return (
                          <div
                            key={c.enrollment_id}
                            className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                          >
                            {thumb ? (
                              <img src={thumb} alt={c.course_title} className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                            ) : (
                              <div className="grid h-14 w-20 shrink-0 place-items-center rounded-lg bg-blue-50 font-display text-xl font-extrabold text-blue-600 dark:bg-blue-500/10">
                                {c.course_title.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-display text-[14px] font-bold ink dark:text-slate-100">{c.course_title}</p>
                              <p className="mb-1.5 mt-0.5 text-[12px] muted2 dark:text-slate-400">{c.progress_percentage}% complete</p>
                              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                <div className="h-full rounded-full grad-blue" style={{ width: `${c.progress_percentage}%` }} />
                              </div>
                            </div>
                            <button
                              onClick={() => navigate(`/learn/${c.course_slug ?? c.course_id}`)}
                              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-blue-700"
                            >
                              Continue
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-[17px] font-bold ink dark:text-slate-100">Recent activity</p>
                    <button
                      onClick={() => navigate("/profile?view=orders")}
                      className="flex items-center gap-1 text-[12px] font-bold uppercase tracking-wide brand-blue transition-all hover:gap-1.5"
                    >
                      View all <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>

                  {loadingOrders ? (
                    <div className="mt-6 flex items-center gap-2 text-[13px] muted2">
                      <div className="pd-spinner" /> Loading…
                    </div>
                  ) : orders.length === 0 ? (
                    <p className="mt-4 text-[13px] muted2 dark:text-slate-400">No recent activity yet — start a course to see your progress here.</p>
                  ) : (
                    <div className="mt-5 flex flex-col gap-3">
                      {orders.slice(0, 4).map(o => {
                        const shortNum = o.order_number.length > 12 ? `…${o.order_number.slice(-8)}` : o.order_number;
                        return (
                          <div
                            key={o.id}
                            className="flex cursor-pointer items-start gap-3 rounded-xl p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
                            onClick={() => navigate("/profile?view=orders")}
                          >
                            <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-semibold ink dark:text-slate-100">Order #{shortNum}</p>
                              <p className="truncate text-[12px] muted2 dark:text-slate-400">{o.items[0]?.course_title ?? "—"}{o.items.length > 1 ? ` +${o.items.length - 1} more` : ""}</p>
                            </div>
                            <span className={`sp-status-badge sp-status-badge--${o.status}`}>{o.status}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3 stat tiles — bottom */}
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-e1 dark:border-slate-700 dark:bg-slate-800 sm:grid-cols-3 sm:p-3">
              <div className="flex items-center gap-4 rounded-xl p-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                  <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-display text-2xl font-extrabold ink dark:text-slate-50">{loadingCourses ? "—" : enrolledCount}</p>
                  <p className="text-[13px] muted2 dark:text-slate-400">Enrolled courses</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-xl border-y border-slate-100 p-4 dark:border-slate-700 sm:border-x sm:border-y-0">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                  <Award className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-display text-2xl font-extrabold ink dark:text-slate-50">{loadingCourses ? "—" : completedCount}</p>
                  <p className="text-[13px] muted2 dark:text-slate-400">Completed</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-xl p-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-50 dark:bg-amber-500/10">
                  <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-display text-2xl font-extrabold ink dark:text-slate-50">—</p>
                  <p className="text-[13px] muted2 dark:text-slate-400">Hours studied</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════ MY COURSES ══════════════════ */}
        {view === "courses" && (
          <>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">Learning</p>
              <h1 className="mt-0.5 font-display text-[28px] font-extrabold ink dark:text-slate-50 sm:text-[34px]">My courses</h1>
              <p className="mt-1 text-[15px] muted2 dark:text-slate-400">Pick up right where you left off.</p>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2">
              {(["inprogress", "completed", "all"] as const).map(f => {
                const labels = { inprogress: "In progress", completed: "Completed", all: "All" };
                const active = courseFilter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setCourseFilter(f)}
                    className={`rounded-full px-5 py-2 text-[14px] font-semibold transition-all ${
                      active
                        ? "grad-blue text-white shadow-glow"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    {labels[f]}
                  </button>
                );
              })}
            </div>

            {loadingCourses ? (
              <div className="flex items-center gap-2 py-8 text-[13px] muted2">
                <div className="pd-spinner" /> Loading courses…
              </div>
            ) : coursesError ? (
              <p className="text-sm text-rose-500">Failed to load courses.</p>
            ) : filteredCourses.length === 0 ? (
              <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 py-16 text-center dark:border-slate-600 dark:bg-slate-800/60">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 dark:bg-blue-500/10">
                  <BookOpen className="h-7 w-7 brand-blue" />
                </div>
                <p className="mt-4 font-display text-[17px] font-bold ink dark:text-slate-100">
                  {courseFilter === "inprogress" ? "No courses in progress" : courseFilter === "completed" ? "No completed courses yet" : "No courses yet"}
                </p>
                <p className="mt-1 text-[14px] muted2 dark:text-slate-400">
                  {courseFilter === "all" ? "Enroll in a course to start learning." : ""}
                </p>
                {courseFilter === "all" && (
                  <button onClick={() => navigate("/courses")} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-blue-700">
                    Browse Courses <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredCourses.map(course => {
                  const thumb = resolveUrl(course.course_thumbnail);
                  const pct = course.progress_percentage;
                  return (
                    <div
                      key={course.enrollment_id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-e1 dark:border-slate-700 dark:bg-slate-800"
                    >
                      {/* Thumbnail */}
                      <div className="h-44 overflow-hidden">
                        {thumb
                          ? <img src={thumb} alt={course.course_title} className="h-44 w-full object-cover" />
                          : <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-3xl dark:from-slate-700 dark:to-slate-600">🎓</div>}
                      </div>

                      {/* Body */}
                      <div className="flex flex-col gap-0 p-5">
                        <span className="text-[11px] font-bold uppercase tracking-wide muted2 dark:text-slate-500">{course.course_level}</span>
                        <h3 className="mt-1 line-clamp-2 font-display text-[15px] font-bold leading-snug ink dark:text-slate-100">{course.course_title}</h3>

                        {/* Progress */}
                        <div className="mt-4">
                          <div className="mb-1.5 flex items-center justify-between text-[12.5px] font-semibold">
                            <span className="text-blue-600 dark:text-blue-400">{pct}% complete</span>
                            <span className="muted2 dark:text-slate-400">{100 - pct}% left</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                            <div className="h-full rounded-full grad-blue" style={{ width: `${pct}%` }} />
                          </div>
                        </div>

                        {/* Resume button */}
                        <button
                          onClick={() => navigate(`/learn/${course.course_slug ?? course.course_id}`)}
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-[14px] font-semibold text-white shadow-glow hover:bg-blue-700"
                        >
                          {pct >= 100 ? <><Play className="h-4 w-4" /> Review</> : <>Resume <ArrowRight className="h-4 w-4" /></>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ══════════════════ ORDERS ══════════════════ */}
        {view === "orders" && (
          <>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">Billing</p>
              <h1 className="mt-0.5 font-display text-[28px] font-extrabold ink dark:text-slate-50 sm:text-[34px]">Orders</h1>
              <p className="mt-1 text-[15px] muted2 dark:text-slate-400">{!loadingOrders && orders.length > 0 ? `${orders.length} order${orders.length !== 1 ? "s" : ""}` : "Your purchase history"}</p>
            </div>

            {loadingOrders ? (
              <div className="flex items-center gap-2 py-8 text-[13px] muted2"><div className="pd-spinner" /> Loading orders…</div>
            ) : ordersError ? (
              <div className="flex flex-col gap-3 text-sm text-rose-500">
                <p>Failed to load orders.</p>
                <button onClick={() => fetchOrders(ordersPage)} className="self-start rounded-lg border border-rose-300 px-4 py-2 text-rose-600 hover:bg-rose-50">Retry</button>
              </div>
            ) : orders.length === 0 ? (
              <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 py-16 text-center dark:border-slate-600 dark:bg-slate-800/60">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 dark:bg-blue-500/10">
                  <BookOpen className="h-7 w-7 brand-blue" />
                </div>
                <p className="mt-4 font-display text-[17px] font-bold ink dark:text-slate-100">No orders yet</p>
                <p className="mt-1 text-[14px] muted2 dark:text-slate-400">Purchase a course to see your orders here.</p>
                <button onClick={() => navigate("/courses")} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-blue-700">
                  Browse Courses <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="pd-orders">
                  {orders.map(order => {
                    const detail = orderDetails[order.id];
                    const isExpanded = expandedOrderId === order.id;
                    const invoice = detail?.invoice;
                    return (
                      <div key={order.id} className="pd-order card">
                        <div className="pd-order-main">
                          <div className="pd-order-top">
                            <div className="pd-order-ids">
                              <span className="pd-order-num">#{order.order_number}</span>
                              {order.invoice_number && <span className="pd-order-inv">{order.invoice_number}</span>}
                            </div>
                            <span className={`pd-order-badge pd-order-badge--${order.status}`}>{order.status}</span>
                          </div>
                          <p className="pd-order-date">{new Date(order.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                          <ul className="pd-order-items">{order.items.map(item => <li key={item.id}>{item.course_title}</li>)}</ul>
                          <button className="pd-order-toggle" onClick={() => toggleOrderDetail(order)}>{isExpanded ? "Hide details ▲" : "View details ▼"}</button>
                        </div>
                        <div className="pd-order-side">
                          {!!order.discount_amount && <span className="pd-order-disc">-${Number(order.discount_amount).toFixed(2)} off</span>}
                          <span className="pd-order-total">${Number(order.final_amount ?? order.total_amount ?? 0).toFixed(2)}</span>
                          <div className="pd-order-btns">
                            <button className="pd-order-pdf-btn" onClick={() => handleDownloadInvoice(order)} disabled={!order.invoice_id || downloadingInvoiceId === order.id}>
                              {downloadingInvoiceId === order.id ? "…" : "Invoice PDF"}
                            </button>
                            <button className="pd-order-pdf-btn" onClick={() => handleDownloadReceipt(order)} disabled={!order.receipt_id || order.payment_status !== "paid" || downloadingReceiptId === order.id}>
                              {downloadingReceiptId === order.id ? "…" : "Receipt PDF"}
                            </button>
                          </div>
                          {invoiceError?.id === order.id && <p className="pd-order-err">⚠ {invoiceError.message}</p>}
                          {receiptError?.id === order.id && <p className="pd-order-err">⚠ {receiptError.message}</p>}
                        </div>
                        {isExpanded && (
                          <div className="pd-order-detail">
                            {(detail?.loadingOrder || detail?.loadingInvoice) ? (
                              <div className="pd-loading"><div className="pd-spinner" />Loading…</div>
                            ) : invoice ? (
                              <>
                                <div className="pd-inv-meta">
                                  <span className="pd-inv-num">{invoice.number}</span>
                                  <span className="pd-inv-date">Issued {new Date(invoice.issued_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                                </div>
                                {(invoice.items?.length ?? 0) > 0 && (
                                  <table className="pd-inv-table">
                                    <thead><tr><th>Item</th><th>Unit Price</th><th>Discount</th><th>Amount</th></tr></thead>
                                    <tbody>{(invoice.items ?? []).map(item => (
                                      <tr key={item.id}><td>{item.description}</td><td>${Number(item.unit_price).toFixed(2)}</td><td>{Number(item.discount_amount) > 0 ? `-$${Number(item.discount_amount).toFixed(2)}` : "—"}</td><td>${Number(item.amount).toFixed(2)}</td></tr>
                                    ))}</tbody>
                                    <tfoot>
                                      <tr><td colSpan={3}>Subtotal</td><td>${Number(invoice.subtotal).toFixed(2)}</td></tr>
                                      {Number(invoice.discount_amount) > 0 && <tr className="pd-inv-disc"><td colSpan={3}>Discount</td><td>-${Number(invoice.discount_amount).toFixed(2)}</td></tr>}
                                      <tr><td colSpan={3}>Tax</td><td>${Number(invoice.tax_amount).toFixed(2)}</td></tr>
                                      <tr className="pd-inv-total"><td colSpan={3}><strong>Total</strong></td><td><strong>${Number(invoice.total).toFixed(2)}</strong></td></tr>
                                    </tfoot>
                                  </table>
                                )}
                                {order.status === "refunded" && (
                                  <div className="pd-cn">
                                    <span className="pd-cn-badge">Credit Note</span>
                                    <span className="pd-cn-text">A credit note has been issued for this order.</span>
                                    <button className="pd-order-pdf-btn" onClick={() => handleDownloadCreditNote(order, invoice.id, invoice.number)} disabled={downloadingCnId === order.id}>
                                      {downloadingCnId === order.id ? "…" : "Download CN"}
                                    </button>
                                    {cnError?.id === order.id && <p className="pd-order-err">⚠ {cnError.message}</p>}
                                  </div>
                                )}
                              </>
                            ) : <p className="pd-inv-empty">No invoice details available yet.</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {ordersLastPage > 1 && (
                  <div className="pd-pagination">
                    <button disabled={ordersPage <= 1} onClick={() => fetchOrders(ordersPage - 1)}>← Prev</button>
                    <span>Page {ordersPage} of {ordersLastPage}</span>
                    <button disabled={ordersPage >= ordersLastPage} onClick={() => fetchOrders(ordersPage + 1)}>Next →</button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ══════════════════ WISHLIST ══════════════════ */}
        {view === "wishlist" && (
          <>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">Saved</p>
              <h1 className="mt-0.5 font-display text-[28px] font-extrabold ink dark:text-slate-50 sm:text-[34px]">Wishlist</h1>
              <p className="mt-1 text-[15px] muted2 dark:text-slate-400">
                {wishlistItems.length === 0
                  ? "Save courses for later by tapping the heart icon."
                  : `Courses you saved for later — ${wishlistItems.length} item${wishlistItems.length !== 1 ? "s" : ""}.`}
              </p>
            </div>

            {wishlistItems.length === 0 ? (
              <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 py-16 text-center dark:border-slate-600 dark:bg-slate-800/60">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 dark:bg-rose-500/10">
                  <Heart className="h-7 w-7 text-rose-500" />
                </div>
                <p className="mt-4 font-display text-[17px] font-bold ink dark:text-slate-100">Your wishlist is empty</p>
                <p className="mt-1 text-[14px] muted2 dark:text-slate-400">Tap the heart on any course to save it here.</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {wishlistItems.map((course, idx) => {
                  const src = course.thumbnail_url
                    ? (course.thumbnail_url.startsWith("http") ? course.thumbnail_url : `${API_BASE}${course.thumbnail_url}`)
                    : null;
                  const isFree = Number(course.price) === 0;
                  const instructorName = course.instructor?.name ?? "Instructor";
                  const initial = instructorName.charAt(0).toUpperCase();
                  const rating = course.level === "beginner" ? "4.5" : course.level === "intermediate" ? "4.7" : "4.9";
                  return (
                    <div
                      key={course.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-e1 transition-all hover:-translate-y-1 hover:shadow-card dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                      style={{ animationDelay: `${idx * 70}ms` }}
                      onClick={() => navigate(`/courses/${course.slug ?? course.id}`)}
                    >
                      {/* Thumbnail */}
                      <div className="relative h-44 overflow-hidden">
                        {src
                          ? <img src={src} alt={course.title} className="h-44 w-full object-cover transition-transform duration-500 hover:scale-105" />
                          : <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-3xl dark:from-slate-700 dark:to-slate-600">🎓</div>}
                        <button
                          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-rose-500 shadow-sm backdrop-blur-sm dark:bg-slate-800/90"
                          onClick={e => { e.stopPropagation(); wishlistToggle(course); }}
                          aria-label="Remove from wishlist"
                        >
                          <Heart className="h-4 w-4 fill-rose-500" />
                        </button>
                      </div>

                      {/* Card body */}
                      <div className="p-5">
                        {/* Instructor row */}
                        <div className="flex items-center gap-2">
                          <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                            {initial}
                          </div>
                          <span className="flex-1 truncate text-[12.5px] muted2 dark:text-slate-400">{instructorName}</span>
                          <span className="flex items-center gap-1 text-[12.5px] font-bold text-amber-500">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {rating}
                          </span>
                        </div>

                        <h3 className="mt-3 line-clamp-2 font-display text-[15px] font-bold leading-snug ink dark:text-slate-100">{course.title}</h3>

                        {/* Price + enroll */}
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-700">
                          <span className="font-display text-lg font-extrabold ink dark:text-slate-50">
                            {isFree ? "Free" : `$${course.price}`}
                          </span>
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/courses/${course.slug ?? course.id}`); }}
                            className="inline-flex items-center gap-1 rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue-700"
                          >
                            Enroll <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ══════════════════ CERTIFICATES ══════════════════ */}
        {view === "certificates" && (
          <>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">Achievements</p>
              <h1 className="mt-0.5 font-display text-[28px] font-extrabold ink dark:text-slate-50 sm:text-[34px]">Certificates</h1>
              <p className="mt-1 text-[15px] muted2 dark:text-slate-400">
                {loadingCourses ? "Loading…" : completedCount > 0
                  ? `${completedCount} certificate${completedCount !== 1 ? "s" : ""} earned`
                  : "Complete a course to earn your first certificate."}
              </p>
            </div>

            {loadingCourses ? (
              <div className="flex items-center gap-2 py-8 text-[13px] muted2"><div className="pd-spinner" /> Loading…</div>
            ) : completedCount === 0 ? (
              <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 py-16 text-center dark:border-slate-600 dark:bg-slate-800/60">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 dark:bg-amber-500/10">
                  <Award className="h-7 w-7 text-amber-500" />
                </div>
                <p className="mt-4 font-display text-[17px] font-bold ink dark:text-slate-100">No certificates yet</p>
                <p className="mt-1 text-[14px] muted2 dark:text-slate-400">Finish a course to unlock your certificate.</p>
                <button onClick={() => navigate("/profile?view=courses")} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-blue-700">
                  My courses <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {courses.filter(c => c.progress_percentage >= 100).map(c => {
                  const thumb = resolveUrl(c.course_thumbnail);
                  const completedDate = c.completed_at
                    ? new Date(c.completed_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                    : "Completed";
                  return (
                    <div key={c.enrollment_id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-e1 dark:border-slate-700 dark:bg-slate-800">
                      {/* Thumbnail strip */}
                      <div className="relative h-32 overflow-hidden">
                        {thumb
                          ? <img src={thumb} alt={c.course_title} className="h-full w-full object-cover brightness-75" />
                          : <div className="flex h-full w-full items-center justify-center grad-blue" />}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="grid h-12 w-12 place-items-center rounded-full bg-white/90 shadow-lg">
                            <Award className="h-6 w-6 text-amber-500" />
                          </div>
                        </div>
                      </div>
                      <div className="p-5">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Certificate of completion</p>
                        <h3 className="mt-1 line-clamp-2 font-display text-[15px] font-bold leading-snug ink dark:text-slate-100">{c.course_title}</h3>
                        <p className="mt-1 text-[12.5px] muted2 dark:text-slate-400">{completedDate}</p>
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => navigate(`/learn/${c.course_slug ?? c.course_id}`)}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                          >
                            Review
                          </button>
                          <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand py-2 text-[13px] font-semibold text-white shadow-glow hover:bg-blue-700">
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ══════════════════ REVIEWS ══════════════════ */}
        {view === "reviews" && (
          <>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">Feedback</p>
              <h1 className="mt-0.5 font-display text-[28px] font-extrabold ink dark:text-slate-50 sm:text-[34px]">My reviews</h1>
              <p className="mt-1 text-[15px] muted2 dark:text-slate-400">Reviews you've left on courses you've taken.</p>
            </div>

            <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 py-16 text-center dark:border-slate-600 dark:bg-slate-800/60">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 dark:bg-blue-500/10">
                <Star className="h-7 w-7 text-blue-500" />
              </div>
              <p className="mt-4 font-display text-[17px] font-bold ink dark:text-slate-100">No reviews yet</p>
              <p className="mt-1 max-w-xs text-[14px] muted2 dark:text-slate-400">
                After completing a course, share your experience to help other learners.
              </p>
              {completedCount > 0 && (
                <button onClick={() => navigate("/profile?view=courses")} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-blue-700">
                  Go to completed courses <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </>
        )}

        {/* ══════════════════ SETTINGS ══════════════════ */}
        {view === "settings" && (
          <>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">Account</p>
              <h1 className="mt-0.5 font-display text-[28px] font-extrabold ink dark:text-slate-50 sm:text-[34px]">Settings</h1>
              <p className="mt-1 text-[15px] muted2 dark:text-slate-400">Manage your account preferences.</p>
            </div>

            <div className="flex flex-col gap-4">
              {/* Notifications */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
                <h2 className="font-display text-[16px] font-bold ink dark:text-slate-100">Notifications</h2>
                <p className="mt-0.5 text-[13px] muted2 dark:text-slate-400">Choose what updates you want to receive.</p>
                <div className="mt-5 flex flex-col gap-4">
                  {[
                    { label: "Course updates", desc: "New lessons, announcements from instructors", on: true },
                    { label: "Promotions & offers", desc: "Discounts and limited-time deals", on: false },
                    { label: "Weekly digest", desc: "A weekly summary of your learning progress", on: true },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[14px] font-semibold ink dark:text-slate-100">{item.label}</p>
                        <p className="text-[12.5px] muted2 dark:text-slate-400">{item.desc}</p>
                      </div>
                      <div className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${item.on ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-600"}`}>
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${item.on ? "translate-x-5" : "translate-x-0.5"}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
                <h2 className="font-display text-[16px] font-bold ink dark:text-slate-100">Privacy</h2>
                <p className="mt-0.5 text-[13px] muted2 dark:text-slate-400">Control who can see your profile.</p>
                <div className="mt-5 flex flex-col gap-4">
                  {[
                    { label: "Public profile", desc: "Allow others to view your learning activity", on: true },
                    { label: "Show certificates", desc: "Display earned certificates on your profile", on: true },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[14px] font-semibold ink dark:text-slate-100">{item.label}</p>
                        <p className="text-[12.5px] muted2 dark:text-slate-400">{item.desc}</p>
                      </div>
                      <div className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${item.on ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-600"}`}>
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${item.on ? "translate-x-5" : "translate-x-0.5"}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Account actions */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
                <h2 className="font-display text-[16px] font-bold ink dark:text-slate-100">Account</h2>
                <p className="mt-0.5 text-[13px] muted2 dark:text-slate-400">Manage your account and data.</p>
                <div className="mt-5 flex flex-col gap-3">
                  <button
                    onClick={() => navigate("/profile/edit")}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left text-[14px] font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Edit profile & password
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </button>
                  <button
                    onClick={() => { logout(); navigate("/"); }}
                    className="flex w-full items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-left text-[14px] font-semibold text-rose-600 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                  >
                    Sign out
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════ EDIT PROFILE ══════════════════ */}
        {editMounted && (
          <div style={{ display: view === "edit" ? "block" : "none" }}>
            <EditProfilePanel />
          </div>
        )}

      </div>
    </ProfileLayout>
  );
}
