import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import type { EnrolledCourse } from "../../../services/courseService";
import { orderService, type Order } from "../../../services/orderService";
import { billingService, type Invoice } from "../../../services/billingService";
import { profileService, type DashboardData } from "../../../services/profileService";
import ProfileLayout from "./ProfileLayout";
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
  if (data && typeof data === "object" && "message" in data) {
    return (data as { message?: string }).message ?? "Download failed.";
  }
  return e.message ?? "Download failed.";
}

function greetingFor(name: string) {
  const h = new Date().getHours();
  const period = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  return `Good ${period}, ${name}`;
}

function formatDate(d = new Date()) {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).toUpperCase();
}

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function StudentProfile() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view") ?? "overview";

  const [studentProfile, setStudentProfile] = useState<DashboardData["profile"] | null>(null);
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLastPage, setOrdersLastPage] = useState(1);

  const [downloadingReceiptId, setDownloadingReceiptId] = useState<number | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<number | null>(null);
  const [downloadingCnId, setDownloadingCnId] = useState<number | null>(null);
  const [receiptError, setReceiptError] = useState<{ id: number; message: string } | null>(null);
  const [invoiceError, setInvoiceError] = useState<{ id: number; message: string } | null>(null);
  const [cnError, setCnError] = useState<{ id: number; message: string } | null>(null);

  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [orderDetails, setOrderDetails] = useState<Record<number, OrderDetail>>({});

  useEffect(() => {
    if (!isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    profileService.getDashboard()
      .then(({ data }) => {
        setStudentProfile(data.data.profile);
        setCourses(data.data.courses ?? []);
      })
      .catch(() => setCoursesError(true))
      .finally(() => setLoadingCourses(false));
  }, [isAuthenticated]);

  const fetchOrders = useCallback(async (page: number) => {
    setLoadingOrders(true);
    setOrdersError(false);
    try {
      const { data } = await orderService.list(page);
      setOrders(data.data.data ?? []);
      setOrdersLastPage(data.data.last_page ?? 1);
      setOrdersPage(data.data.current_page ?? page);
    } catch {
      setOrdersError(true);
    }
    setLoadingOrders(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchOrders(1);
  }, [isAuthenticated, fetchOrders]);

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
  const todayIdx = (new Date().getDay() + 6) % 7; // 0=Mon

  const activeLabel = view === "courses" ? "My courses" : view === "orders" ? "Orders" : "Overview";

  return (
    <ProfileLayout activeLabel={activeLabel}>
      <div key={view} className="pd-view-shell">

      {/* ══ OVERVIEW ══════════════════════════════════════════════════════ */}
      {view === "overview" && (
        <div className="pd-root">

          {/* ── Greeting + Streak row ── */}
          <div className="pd-top">
            <div className="pd-hello">
              <p className="pd-eyebrow">{formatDate()}</p>
              <h1 className="pd-h1">{greetingFor(firstName)} 👋</h1>
              <p className="pd-sub">Keep going — your next lesson awaits.</p>
            </div>

            <div className="pd-streak card">
              <div className="pd-streak-meta">
                <span className="pd-streak-count">🔥 0-day streak</span>
                <span className="pd-streak-best">Best · 0</span>
              </div>
              <div className="pd-week">
                {WEEK_DAYS.map((d, i) => (
                  <div key={d} className={`pd-day${i === todayIdx ? " pd-day--today" : ""}`}>
                    <div className="pd-day-dot" />
                    <span className="pd-day-label">{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Three-column row ── */}
          <div className="pd-row">

            {/* Profile card */}
            <div className="pd-pf card">
              <div className="pd-pf-av">
                {avatarSrc ? (
                  <img src={avatarSrc} alt={displayName} />
                ) : (
                  <span>{displayName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="pd-pf-name">{displayName}</div>
              <span className="pd-pf-badge">STUDENT</span>

              <div className="pd-pf-rows">
                {user?.created_at && (
                  <div className="pd-pf-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                    </svg>
                    Joined {new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </div>
                )}
                {user?.email && (
                  <div className="pd-pf-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>
                    </svg>
                    {user.email}
                  </div>
                )}
              </div>

              <div className="pd-pf-stats">
                <div className="pd-pf-stat">
                  <span className="pd-pf-stat-n">{loadingCourses ? "—" : enrolledCount}</span>
                  <span className="pd-pf-stat-l">Enrolled</span>
                </div>
                <div className="pd-pf-stat-div" />
                <div className="pd-pf-stat">
                  <span className="pd-pf-stat-n">{loadingCourses ? "—" : completedCount}</span>
                  <span className="pd-pf-stat-l">Completed</span>
                </div>
              </div>

              <button className="pd-pf-edit-btn" onClick={() => navigate("/profile/edit")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit profile
              </button>

              {user?.role !== "instructor" && user?.instructor_status !== "verified" && user?.instructor_status !== "pending" && (
                <button className="pd-pf-instructor-btn" onClick={() => navigate("/instructor/register")}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  Become an Instructor
                </button>
              )}

              {user?.instructor_status === "pending" && (
                <div className="pd-pf-pending-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                  </svg>
                  Application pending
                </div>
              )}

              <button className="pd-pf-logout-btn" onClick={() => { logout(); navigate("/"); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Log out
              </button>
            </div>

            {/* Continue learning */}
            <div className="pd-panel card">
              <div className="pd-panel-head">
                <span>Continue learning</span>
                <button className="pd-panel-all" onClick={() => navigate("/profile?view=courses")}>VIEW ALL →</button>
              </div>

              {loadingCourses ? (
                <div className="pd-loading"><div className="pd-spinner" />Loading…</div>
              ) : coursesError ? (
                <p className="pd-empty-text">Could not load courses.</p>
              ) : courses.length === 0 ? (
                <div className="pd-empty">
                  <p>You haven't enrolled in any courses yet.</p>
                  <button onClick={() => navigate("/courses")}>Browse Courses</button>
                </div>
              ) : (
                <div className="pd-course-list">
                  {courses.slice(0, 3).map((c, i) => (
                    <div key={c.enrollment_id} className="pd-course-row">
                      <div className={`pd-course-icon pd-course-icon--${i % 3 === 0 ? "red" : i % 3 === 1 ? "ink" : "pine"}`}>
                        {c.course_title.charAt(0).toUpperCase()}
                      </div>
                      <div className="pd-course-info">
                        <div className="pd-course-title">{c.course_title}</div>
                        <div className="pd-course-meta">
                          <div className="pd-bar">
                            <div className="pd-bar-fill" style={{ width: `${c.progress_percentage}%` }} />
                          </div>
                          <span className="pd-bar-pct">{c.progress_percentage}%</span>
                        </div>
                      </div>
                      <button
                        className="pd-course-btn"
                        onClick={() => navigate(`/learn/${c.course_slug ?? c.course_id}`)}
                      >
                        Continue
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent activity */}
            <div className="pd-act card">
              <div className="pd-panel-head">
                <span>Recent activity</span>
                <button className="pd-panel-all" onClick={() => navigate("/profile?view=orders")}>VIEW ALL →</button>
              </div>
              {loadingOrders ? (
                <div className="pd-loading"><div className="pd-spinner" />Loading…</div>
              ) : orders.length === 0 ? (
                <p className="pd-empty-text">No recent activity.</p>
              ) : (
                <div className="pd-act-list">
                  {orders.slice(0, 4).map(o => {
                    // Shorten long order numbers: show last 8 chars
                    const shortNum = o.order_number.length > 12
                      ? `…${o.order_number.slice(-8)}`
                      : o.order_number;
                    return (
                      <div
                        key={o.id}
                        className="pd-act-item pd-act-item--click"
                        onClick={() => navigate("/profile?view=orders")}
                        title={`Order #${o.order_number}`}
                      >
                        <div className="pd-act-dot" />
                        <div className="pd-act-body">
                          <div className="pd-act-label">Order #{shortNum}</div>
                          <div className="pd-act-sub">
                            {o.items[0]?.course_title ?? "—"}{o.items.length > 1 ? ` +${o.items.length - 1} more` : ""}
                          </div>
                          <div className="pd-act-date">
                            {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                        </div>
                        <span className={`pd-act-status pd-act-status--${o.status}`}>{o.status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Progress tiles ── */}
          <div className="pd-tiles card">
            <div className="pd-tile">
              <div className="pd-tile-icon pd-tile-icon--gold">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 5.5C7 5 9.5 5.4 12 7c2.5-1.6 5-2 8-1.5V18c-3-.5-5.5-.1-8 1.5-2.5-1.6-5-2-8-1.5Z"/>
                </svg>
              </div>
              <div className="pd-tile-body">
                <div className="pd-tile-n">{loadingCourses ? "—" : enrolledCount}</div>
                <div className="pd-tile-l">Enrolled courses</div>
              </div>
            </div>
            <div className="pd-tile-div" />
            <div className="pd-tile">
              <div className="pd-tile-icon pd-tile-icon--pine">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="9" r="6"/><path d="m9 9 2 2 4-4"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8"/>
                </svg>
              </div>
              <div className="pd-tile-body">
                <div className="pd-tile-n">{loadingCourses ? "—" : completedCount}</div>
                <div className="pd-tile-l">Completed</div>
              </div>
            </div>
            <div className="pd-tile-div" />
            <div className="pd-tile">
              <div className="pd-tile-icon pd-tile-icon--ink">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <div className="pd-tile-body">
                <div className="pd-tile-n">—</div>
                <div className="pd-tile-l">Hours studied</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ MY COURSES ════════════════════════════════════════════════════ */}
      {view === "courses" && (
        <div className="pd-root">
          <div className="pd-view-head">
            <h1 className="pd-view-title">My courses</h1>
            {!loadingCourses && <span className="pd-view-count">{enrolledCount}</span>}
          </div>

          {loadingCourses ? (
            <div className="pd-state"><div className="pd-spinner" /><p>Loading courses…</p></div>
          ) : coursesError ? (
            <div className="pd-state-err"><p>Failed to load courses.</p></div>
          ) : courses.length === 0 ? (
            <div className="pd-state">
              <p>You haven't enrolled in any courses yet.</p>
              <button onClick={() => navigate("/courses")}>Browse Courses</button>
            </div>
          ) : (
            <div className="pd-courses-grid">
              {courses.map(course => (
                <div
                  key={course.enrollment_id}
                  className="pd-ccard"
                  onClick={() => navigate(`/learn/${course.course_slug ?? course.course_id}`)}
                >
                  {resolveUrl(course.course_thumbnail) ? (
                    <img
                      src={resolveUrl(course.course_thumbnail)!}
                      alt={course.course_title}
                      className="pd-ccard-thumb"
                      onError={e => { e.currentTarget.style.display = "none"; }}
                    />
                  ) : (
                    <div className="pd-ccard-thumb pd-ccard-thumb--ph">🎓</div>
                  )}
                  <div className="pd-ccard-body">
                    <div className="pd-ccard-level">{course.course_level}</div>
                    <h3 className="pd-ccard-title">{course.course_title}</h3>
                    <div className="pd-ccard-prog">
                      <div className="pd-bar">
                        <div className="pd-bar-fill" style={{ width: `${course.progress_percentage}%` }} />
                      </div>
                      <span className="pd-bar-pct">{course.progress_percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ ORDERS ════════════════════════════════════════════════════════ */}
      {view === "orders" && (
        <div className="pd-root">
          <div className="pd-view-head">
            <h1 className="pd-view-title">Orders</h1>
            {!loadingOrders && orders.length > 0 && <span className="pd-view-count">{orders.length}</span>}
          </div>

          {loadingOrders ? (
            <div className="pd-state"><div className="pd-spinner" /><p>Loading orders…</p></div>
          ) : ordersError ? (
            <div className="pd-state-err">
              <p>Failed to load orders.</p>
              <button onClick={() => fetchOrders(ordersPage)}>Retry</button>
            </div>
          ) : orders.length === 0 ? (
            <div className="pd-state">
              <p>No orders yet.</p>
              <button onClick={() => navigate("/courses")}>Browse Courses</button>
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
                            {order.invoice_number && (
                              <span className="pd-order-inv">{order.invoice_number}</span>
                            )}
                          </div>
                          <span className={`pd-order-badge pd-order-badge--${order.status}`}>{order.status}</span>
                        </div>

                        <p className="pd-order-date">
                          {new Date(order.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </p>

                        <ul className="pd-order-items">
                          {order.items.map(item => (
                            <li key={item.id}>{item.course_title}</li>
                          ))}
                        </ul>

                        <button className="pd-order-toggle" onClick={() => toggleOrderDetail(order)}>
                          {isExpanded ? "Hide details ▲" : "View details ▼"}
                        </button>
                      </div>

                      <div className="pd-order-side">
                        {!!order.discount_amount && (
                          <span className="pd-order-disc">-${Number(order.discount_amount).toFixed(2)} off</span>
                        )}
                        <span className="pd-order-total">
                          ${Number(order.final_amount ?? order.total_amount ?? 0).toFixed(2)}
                        </span>

                        <div className="pd-order-btns">
                          <button
                            className="pd-order-pdf-btn"
                            onClick={() => handleDownloadInvoice(order)}
                            disabled={!order.invoice_id || downloadingInvoiceId === order.id}
                            title={!order.invoice_id ? "Invoice not yet generated" : "Download Invoice PDF"}
                          >
                            {downloadingInvoiceId === order.id ? "…" : "Invoice PDF"}
                          </button>
                          <button
                            className="pd-order-pdf-btn"
                            onClick={() => handleDownloadReceipt(order)}
                            disabled={!order.receipt_id || order.payment_status !== "paid" || downloadingReceiptId === order.id}
                            title={!order.receipt_id ? "Receipt available once paid" : "Download Receipt PDF"}
                          >
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
                                <span className="pd-inv-date">
                                  Issued {new Date(invoice.issued_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                                </span>
                              </div>

                              {invoice.items && invoice.items.length > 0 && (
                                <table className="pd-inv-table">
                                  <thead>
                                    <tr><th>Item</th><th>Unit Price</th><th>Discount</th><th>Amount</th></tr>
                                  </thead>
                                  <tbody>
                                    {invoice.items.map(item => (
                                      <tr key={item.id}>
                                        <td>{item.description}</td>
                                        <td>${Number(item.unit_price).toFixed(2)}</td>
                                        <td>{Number(item.discount_amount) > 0 ? `-$${Number(item.discount_amount).toFixed(2)}` : "—"}</td>
                                        <td>${Number(item.amount).toFixed(2)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr><td colSpan={3}>Subtotal</td><td>${Number(invoice.subtotal).toFixed(2)}</td></tr>
                                    {Number(invoice.discount_amount) > 0 && (
                                      <tr className="pd-inv-disc"><td colSpan={3}>Discount</td><td>-${Number(invoice.discount_amount).toFixed(2)}</td></tr>
                                    )}
                                    <tr><td colSpan={3}>Tax</td><td>${Number(invoice.tax_amount).toFixed(2)}</td></tr>
                                    <tr className="pd-inv-total"><td colSpan={3}><strong>Total</strong></td><td><strong>${Number(invoice.total).toFixed(2)}</strong></td></tr>
                                  </tfoot>
                                </table>
                              )}

                              {order.status === "refunded" && (
                                <div className="pd-cn">
                                  <span className="pd-cn-badge">Credit Note</span>
                                  <span className="pd-cn-text">A credit note has been issued for this order.</span>
                                  <button
                                    className="pd-order-pdf-btn"
                                    onClick={() => handleDownloadCreditNote(order, invoice.id, invoice.number)}
                                    disabled={downloadingCnId === order.id}
                                  >
                                    {downloadingCnId === order.id ? "…" : "Download CN"}
                                  </button>
                                  {cnError?.id === order.id && <p className="pd-order-err">⚠ {cnError.message}</p>}
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="pd-inv-empty">No invoice details available yet.</p>
                          )}
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
        </div>
      )}

      </div>{/* end pd-view-shell */}
    </ProfileLayout>
  );
}
