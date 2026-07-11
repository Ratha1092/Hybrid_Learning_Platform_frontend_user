import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CheckCircle2, Play, Clock, Search, X, RotateCcw, GraduationCap, LogIn } from "lucide-react";
import { courseService, type EnrolledCourse } from "../../services/courseService";
import { useAuth } from "../../context/AuthContext";
import { useAuthModal } from "../../context/AuthModalContext";
import "./Library.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

function resolveThumb(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

function levelColor(level: string) {
  const l = level.toLowerCase();
  if (l === "beginner")     return "lb-badge--green";
  if (l === "intermediate") return "lb-badge--orange";
  if (l === "advanced")     return "lb-badge--red";
  return "lb-badge--gray";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Thumb({ url, title }: { url: string | null; title: string }) {
  const [err, setErr] = useState(false);
  const src = resolveThumb(url);
  return src && !err ? (
    <img src={src} alt={title} className="lb-thumb-img" onError={() => setErr(true)} />
  ) : (
    <div className="lb-thumb-placeholder">
      <BookOpen size={28} />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="lb-card lb-card--skeleton">
      <div className="lb-thumb-wrap skeleton" />
      <div className="lb-card-body">
        <div className="skeleton skeleton-line skeleton-line--sm" />
        <div className="skeleton skeleton-line skeleton-line--lg" style={{ marginTop: 8 }} />
        <div className="skeleton skeleton-line skeleton-line--md" />
        <div className="skeleton skeleton-line skeleton-line--sm" style={{ marginTop: 16 }} />
        <div className="skeleton skeleton-line skeleton-line--btn" style={{ marginTop: 12 }} />
      </div>
    </div>
  );
}

type Tab = "all" | "in-progress" | "completed";

export default function Library() {
  const { user, isAuthenticated } = useAuth();
  const { openLogin, openRegister } = useAuthModal();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");

  function load() {
    setLoading(true);
    setError(null);
    courseService
      .getEnrolled()
      .then(({ data }) => setCourses(data.data ?? []))
      .catch(() => setError("Failed to load your library. Please try again."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (isAuthenticated) load();
    else setLoading(false);
  }, [isAuthenticated]);

  const firstName = user?.name?.split(" ")[0] ?? "there";

  const stats = useMemo(() => ({
    total:      courses.length,
    inProgress: courses.filter(c => c.progress_percentage > 0 && c.progress_percentage < 100).length,
    completed:  courses.filter(c => c.progress_percentage >= 100).length,
  }), [courses]);

  const filtered = useMemo(() => {
    let list = courses;
    if (tab === "in-progress") list = list.filter(c => c.progress_percentage > 0 && c.progress_percentage < 100);
    if (tab === "completed")   list = list.filter(c => c.progress_percentage >= 100);
    if (search.trim())         list = list.filter(c => c.course_title.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [courses, tab, search]);

  return (
    <>
      {/* ── Guest state ── */}
      {!isAuthenticated && (
        <div className="lb-body" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="lb-state">
            <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg,#2563EB,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <BookOpen size={34} color="#fff" />
            </div>
            <h2 className="lb-state-title">Your learning library</h2>
            <p className="lb-state-msg" style={{ maxWidth: 380 }}>
              Sign in to access your enrolled courses, track your progress, and continue where you left off.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button className="lb-btn-browse" onClick={openLogin} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <LogIn size={16} /> Sign In
              </button>
              <button className="lb-btn-retry" onClick={openRegister} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Authenticated view ── */}
      {isAuthenticated && <>
      {/* ── Hero ── */}
      <div className="lb-hero">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="lb-hero-inner">
            <div>
              <h1 className="lb-hero-title">
                Welcome back, <span className="lb-hero-name">{firstName}</span>
              </h1>
              <p className="lb-hero-sub">Pick up where you left off — your courses are waiting.</p>
            </div>
            {!loading && courses.length > 0 && (
              <div className="lb-hero-stats">
                <div className="lb-stat">
                  <span className="lb-stat-val">{stats.total}</span>
                  <span className="lb-stat-label">Enrolled</span>
                </div>
                <div className="lb-stat-sep" />
                <div className="lb-stat">
                  <span className="lb-stat-val">{stats.inProgress}</span>
                  <span className="lb-stat-label">In Progress</span>
                </div>
                <div className="lb-stat-sep" />
                <div className="lb-stat">
                  <span className="lb-stat-val">{stats.completed}</span>
                  <span className="lb-stat-label">Completed</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="lb-body">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">

          {/* Toolbar */}
          {!loading && !error && courses.length > 0 && (
            <div className="lb-toolbar">
              <div className="lb-tabs">
                {(["all", "in-progress", "completed"] as Tab[]).map(t => (
                  <button
                    key={t}
                    className={`lb-tab ${tab === t ? "lb-tab--active" : ""}`}
                    onClick={() => setTab(t)}
                  >
                    {t === "all"         ? `All (${stats.total})`          : null}
                    {t === "in-progress" ? `In Progress (${stats.inProgress})` : null}
                    {t === "completed"   ? `Completed (${stats.completed})`   : null}
                  </button>
                ))}
              </div>

              <div className="lb-search-wrap">
                <Search size={16} className="lb-search-icon" />
                <input
                  className="lb-search"
                  placeholder="Search your courses…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button className="lb-search-clear" onClick={() => setSearch("")}>
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="lb-grid">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="lb-state">
              <GraduationCap size={48} className="lb-state-icon lb-state-icon--muted" />
              <p className="lb-state-msg">{error}</p>
              <button className="lb-btn-retry" onClick={load}>
                <RotateCcw size={15} /> Try again
              </button>
            </div>
          )}

          {/* Empty — no enrollments */}
          {!loading && !error && courses.length === 0 && (
            <div className="lb-state">
              <BookOpen size={52} className="lb-state-icon lb-state-icon--blue" />
              <h2 className="lb-state-title">Your library is empty</h2>
              <p className="lb-state-msg">You haven't enrolled in any courses yet. Find something you love and start learning today.</p>
              <Link to="/courses" className="lb-btn-browse">Browse Courses</Link>
            </div>
          )}

          {/* Empty — filter match */}
          {!loading && !error && courses.length > 0 && filtered.length === 0 && (
            <div className="lb-state">
              <Search size={40} className="lb-state-icon lb-state-icon--muted" />
              <p className="lb-state-msg">No courses match your filters.</p>
              <button className="lb-btn-retry" onClick={() => { setSearch(""); setTab("all"); }}>
                Clear filters
              </button>
            </div>
          )}

          {/* Grid */}
          {!loading && !error && filtered.length > 0 && (
            <div className="lb-grid">
              {filtered.map(course => {
                const done = course.progress_percentage >= 100;
                const started = course.progress_percentage > 0;
                const slug = course.course_slug ?? String(course.course_id);
                return (
                  <div key={course.enrollment_id} className="lb-card">
                    <div className="lb-thumb-wrap">
                      <Thumb url={course.course_thumbnail} title={course.course_title} />
                      {done && (
                        <div className="lb-completed-badge">
                          <CheckCircle2 size={14} /> Completed
                        </div>
                      )}
                    </div>

                    <div className="lb-card-body">
                      <div className="lb-card-meta">
                        <span className={`lb-badge ${levelColor(course.course_level)}`}>
                          {course.course_level}
                        </span>
                        <span className="lb-enrolled-date">
                          <Clock size={11} /> {formatDate(course.enrolled_at)}
                        </span>
                      </div>

                      <h3 className="lb-card-title">{course.course_title}</h3>

                      <div className="lb-progress-wrap">
                        <div className="lb-progress-bar">
                          <div
                            className={`lb-progress-fill ${done ? "lb-progress-fill--done" : ""}`}
                            style={{ width: `${course.progress_percentage}%` }}
                          />
                        </div>
                        <span className="lb-progress-pct">{Math.round(course.progress_percentage)}%</span>
                      </div>

                      <Link
                        to={`/learn/${slug}`}
                        className={`lb-continue-btn ${done ? "lb-continue-btn--done" : ""}`}
                      >
                        {done ? (
                          <><CheckCircle2 size={15} /> Review Course</>
                        ) : started ? (
                          <><Play size={13} fill="currentColor" /> Continue</>
                        ) : (
                          <><Play size={13} fill="currentColor" /> Start Learning</>
                        )}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
      </>}

    </>
  );
}
