import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { courseService, type Course } from "../../services/courseService";
import "./Page_Courses.css";

const LEVELS = ["All", "beginner", "intermediate", "advanced"];

const SKELETON_COUNT = 6;

const API_BASE = import.meta.env.VITE_API_URL ?? "";
function resolveUrl(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

function CourseThumb({ url, title, level, children }: { url: string | null; title: string; level: string; children?: React.ReactNode }) {
  const [err, setErr] = useState(false);
  const src = resolveUrl(url);
  return (
    <div className={`course-card__thumb course-card__thumb--${level.toLowerCase()}`}>
      {src && !err ? (
        <img src={src} alt={title} onError={() => setErr(true)} />
      ) : (
        <div className="course-card__thumb-placeholder">
          <span className="course-card__thumb-icon">🎓</span>
        </div>
      )}
      {children}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="course-card course-card--skeleton">
      <div className="skeleton skeleton--thumb" />
      <div className="course-card__body">
        <div className="skeleton skeleton--line skeleton--sm" />
        <div className="skeleton skeleton--line skeleton--lg" style={{ marginTop: 8 }} />
        <div className="skeleton skeleton--line skeleton--md" />
        <div className="skeleton skeleton--line skeleton--sm" style={{ marginTop: 12 }} />
      </div>
    </div>
  );
}

function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("All");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopyLink = async (e: React.MouseEvent, course: Course) => {
    e.stopPropagation();
    const url = `${window.location.origin}/courses/${course.slug ?? course.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(course.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* clipboard unavailable */ }
  };
 

  const [searchParams] = useSearchParams();
  const category = searchParams.get("category");
  const navigate = useNavigate();
  const isMounted = useRef(false);

  const load = async (currentSearch: string, silent = false) => {
    if (!silent) setLoading(true);

    setError(null);
    try {
      const { data } = category
        ? await courseService.getByCategory(category)
        : await courseService.getAll(currentSearch || undefined);
      const list = category ? (data.data as unknown as { courses: Course[] }).courses ?? [] : (data.data as unknown as Course[]) ?? [];
      setCourses(list);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load courses.");
    }
    setLoading(false);

  };

  useEffect(() => { load(search); }, [category]);

  // Debounce search — skip the first render since the effect above already loaded.
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    const timer = setTimeout(() => load(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const filtered = courses.filter((c) => {
    const matchLevel = level === "All" || c.level.toLowerCase() === level.toLowerCase();
    return matchLevel;
  });

  const levelCounts = LEVELS.slice(1).reduce<Record<string, number>>((acc, l) => {
    acc[l] = courses.filter((c) => c.level.toLowerCase() === l).length;
    return acc;
  }, {});

  return (
    <section className="courses-page">

      {/* ── Header ── */}
      <div className="courses-header">
        <div>
          <h1 className="courses-header__title">
            {category ? category.toUpperCase() : "All Courses"}
            <span className="courses-header__accent">✦</span>
          </h1>
          <p className="courses-header__sub">
            {loading ? "Loading..." : `${courses.length} courses available`}
          </p>
        </div>
     
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="error-banner">
          <span className="error-banner__icon">⚠</span>
          <div>
            <strong>Failed to load</strong>
            <p>{error}</p>
          </div>
          <button className="error-banner__retry" onClick={() => load(search)}>Retry</button>
        </div>
      )}

    
      {/* ── Filters ── */}
      <div className="filters">
        <div className="filters__search-wrap">
          <span className="filters__search-icon">⌕</span>
          <input
            className="filters__search"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filters__pills">
          {LEVELS.map((l) => (
            <button
              key={l}
              className={`filter-pill${level === l ? " filter-pill--active" : ""}`}
              onClick={() => setLevel(l)}
            >
              {l}
              {l !== "All" && levelCounts[l] > 0 && (
                <span className="filter-pill__count">{levelCounts[l]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="courses-grid">
        {loading ? (
          Array.from({ length: SKELETON_COUNT }).map((_, i) => <SkeletonCard key={i} />)
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__icon">📚</span>
            <p>{search ? `រកមិនឃើញវគ្គសិក្សាសម្រាប់ "${search}" ទេ` : "មិនមានវគ្គសិក្សាទេ"}</p>
            <button className="empty-state__clear" onClick={() => { setSearch(""); setLevel("All"); }}>
              សម្អាតតម្រង
            </button>
          </div>
        ) : (
          filtered.map((course) => (
            <div
              key={course.id}
              className="course-card"
              onClick={() => navigate(`/courses/${course.slug ?? course.id}`)}
            >
              {/* Thumbnail */}
              <CourseThumb url={course.thumbnail_url} title={course.title} level={course.level}>
                <span className={`course-card__badge${Number(course.price) === 0 ? " course-card__badge--free" : ""}`}>
                  {Number(course.price) === 0 ? "Free" : `$${course.price}`}
                </span>
              </CourseThumb>

              {/* Body */}
              <div className="course-card__body">
                <div className="course-card__provider">
                  <div className="course-card__avatar">
                    {course.instructor?.name ? course.instructor.name.charAt(0).toUpperCase() : "DRC"}
                  </div>
                  <span className="course-card__category">
                    {course.instructor?.name ?? course.language}
                  </span>
                </div>

                <h3 className="course-card__title">{course.title}</h3>
                <p className="course-card__desc">{course.short_description}</p>

                <div className="course-card__stats">
                  <span className="course-card__stat">
                    <span className="stat-icon">👥</span>
                    {course.students_count ?? 0}
                  </span>
                  <span className="course-card__stat-sep">·</span>
                  <span className="course-card__stat">
                    <span className="stat-icon">👁</span>
                    {course.views_count ?? 0}
                  </span>
                  <span className="course-card__stat-sep">·</span>
                  <span className="course-card__stat">
                    <span className="stat-icon">⭐</span>
                    {course.reviews_count ?? 0}
                  </span>
                </div>

                <div className="course-card__footer">
                  <button
                    className={`course-card__copy-btn${copiedId === course.id ? " course-card__copy-btn--copied" : ""}`}
                    onClick={(e) => handleCopyLink(e, course)}
                    title="Copy course link"
                  >
                    {copiedId === course.id ? (
                      <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Copied!</>
                    ) : (
                      <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Copy</>
                    )}
                  </button>
                  <button
                    className="course-card__view-btn"
                    onClick={(e) => { e.stopPropagation(); navigate(`/courses/${course.slug ?? course.id}`); }}
                  >
                    View More
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default Courses;
