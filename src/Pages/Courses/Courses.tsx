import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { courseService, type Course } from "../../services/courseService";
import "./Courses.css";

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
  const [refreshing, setRefreshing] = useState(false);

  const [searchParams] = useSearchParams();
  const category = searchParams.get("category");
  const navigate = useNavigate();

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const { data } = category
        ? await courseService.getByCategory(category)
        : await courseService.getAll();
      const list = category ? (data.data as unknown as { courses: Course[] }).courses ?? [] : (data.data as unknown as Course[]) ?? [];
      setCourses(list);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load courses.");
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, [category]);

  const filtered = courses.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchLevel = level === "All" || c.level.toLowerCase() === level.toLowerCase();
    return matchSearch && matchLevel;
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
          <button className="error-banner__retry" onClick={() => load()}>Retry</button>
        </div>
      )}

      {/* ── Stats ── */}
      {!loading && courses.length > 0 && (
        <div className="stats-bar">
          <div className="stat-card">
            <span className="stat-card__value">{courses.length}</span>
            <span className="stat-card__label">Total</span>
          </div>
          {Object.entries(levelCounts).map(([l, count]) => count > 0 && (
            <div className="stat-card" key={l}>
              <span className="stat-card__value">{count}</span>
              <span className="stat-card__label">{l}</span>
            </div>
          ))}
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
            <p>No courses found</p>
            <button className="empty-state__clear" onClick={() => { setSearch(""); setLevel("All"); }}>
              Clear filters
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
                  <div className="course-card__avatar">DRC</div>
                  <span className="course-card__category">{course.language}</span>
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
