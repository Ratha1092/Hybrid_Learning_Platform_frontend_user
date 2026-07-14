import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowRight, Star, Clock, BookOpen, BarChart3, Heart, Award } from "lucide-react";
import { courseService, type Course } from "../../services/courseService";
import { categoryService } from "../../services/categoryService";
import { useProtectedWishlist } from "../../hooks/useProtectedWishlist";
import "./Page_Courses.css";

const SKELETON_COUNT = 6;

const API_BASE = import.meta.env.VITE_API_URL ?? "";
function resolveUrl(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

const LEVEL_COLORS: Record<string, string> = {
  beginner:     "from-emerald-500/15 to-emerald-500/5",
  intermediate: "from-blue-500/15 to-blue-500/5",
  advanced:     "from-rose-500/15 to-rose-500/5",
};

function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-e1 dark:border-slate-700 dark:bg-slate-800">
      <div className="h-48 w-full animate-pulse bg-slate-200 dark:bg-slate-700" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="h-5 w-3/4 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-full animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="mt-auto h-8 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}

const PER_PAGE = 12;

// Module-level cache for the default (no filter) first page
let _cachedDefault: { courses: Course[]; lastPage: number } | null = null;
let _cachedCategories: import("../../services/categoryService").Category[] | null = null;
// When backend returns a flat array (no server-side pagination), store all courses here
// so we can slice client-side for page changes without re-fetching
let _flatStore: { key: string; search: string; courses: Course[] } | null = null;

function Courses() {
  const { toggle, isWishlisted } = useProtectedWishlist();
  const [courses, setCourses] = useState<Course[]>(_cachedDefault?.courses ?? []);
  const [categories, setCategories] = useState<import("../../services/categoryService").Category[]>(_cachedCategories ?? []);
  const [loading, setLoading] = useState(!_cachedDefault);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("All");
  const [freeOnly, setFreeOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(_cachedDefault?.lastPage ?? 1);

  const [searchParams] = useSearchParams();
  const category = searchParams.get("category");
  const categoryName = searchParams.get("name") ?? null;
  const instructorId = searchParams.get("instructor") ? Number(searchParams.get("instructor")) : null;
  const instructorName = !category ? (searchParams.get("name") ?? null) : null;
  const navigate = useNavigate();
  const isMounted = useRef(false);

  const load = async (currentSearch: string, currentPage = 1) => {
    const cacheKey = category ? `cat:${category}` : instructorId ? `ins:${instructorId}` : "all";

    // Client-side pagination: reuse stored flat array without re-fetching
    if (_flatStore?.key === cacheKey && _flatStore.search === (currentSearch || "")) {
      const all = _flatStore.courses;
      const lp = Math.max(1, Math.ceil(all.length / PER_PAGE));
      setCourses(all.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE));
      setLastPage(lp);
      setTotal(all.length);
      setPage(currentPage);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const applyFlat = (raw: Course[]) => {
      _flatStore = { key: cacheKey, search: currentSearch || "", courses: raw };
      const lp = Math.max(1, Math.ceil(raw.length / PER_PAGE));
      return { list: raw.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE), lp, tot: raw.length };
    };

    const applyPaged = (raw: unknown) => {
      const p = raw as import("../../services/courseService").CoursePage;
      return { list: p?.data ?? [], lp: p?.last_page ?? 1, tot: p?.total ?? (p?.data?.length ?? 0) };
    };

    try {
      let list: Course[] = [];
      let lp = 1;
      let tot = 0;

      if (category) {
        const { data } = await courseService.getByCategory(category);
        const payload = data.data as { courses?: Course[] } | Course[] | unknown;
        const allCourses: Course[] = Array.isArray(payload)
          ? (payload as Course[])
          : ((payload as { courses?: Course[] }).courses ?? []);
        ({ list, lp, tot } = applyFlat(allCourses));
      } else if (instructorId) {
        const { data } = await courseService.getByInstructor(instructorId, currentSearch || undefined, currentPage, PER_PAGE);
        const raw = data.data as unknown;
        ({ list, lp, tot } = Array.isArray(raw) ? applyFlat(raw as Course[]) : applyPaged(raw));
      } else {
        const { data } = await courseService.getAll(currentSearch || undefined, currentPage, PER_PAGE);
        const raw = data.data as unknown;
        ({ list, lp, tot } = Array.isArray(raw) ? applyFlat(raw as Course[]) : applyPaged(raw));
        if (!currentSearch && currentPage === 1) {
          _cachedDefault = { courses: list, lastPage: lp };
        }
      }

      setCourses(list);
      setLastPage(lp);
      setTotal(tot);
      setPage(currentPage);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load courses.");
    }
    setLoading(false);
  };

  useEffect(() => {
    load(search, 1);
    isMounted.current = false;
  }, [category, instructorId]);

  useEffect(() => {
    if (_cachedCategories) return;
    categoryService.getAll()
      .then(({ data }) => { setCategories(data.data); _cachedCategories = data.data; })
      .catch(() => {});
  }, []);

  // Debounce search — reset to page 1
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    const timer = setTimeout(() => load(search, 1), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const goToPage = (p: number) => {
    if (p < 1 || p > lastPage || p === page) return;
    load(search, p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Build page number array with ellipsis
  const pageNumbers = (): (number | "…")[] => {
    if (lastPage <= 7) return Array.from({ length: lastPage }, (_, i) => i + 1);
    const pages: (number | "…")[] = [1];
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(lastPage - 1, page + 1); i++) pages.push(i);
    if (page < lastPage - 2) pages.push("…");
    pages.push(lastPage);
    return pages;
  };

  const filtered = courses.filter((c) => {
    const matchLevel = level === "All" || c.level.toLowerCase() === level.toLowerCase();
    const matchFree = !freeOnly || Number(c.price) === 0;
    return matchLevel && matchFree;
  });

  const clearFilters = () => { setSearch(""); setLevel("All"); setFreeOnly(false); };

  return (
    <section className="courses-page">

      {/* Back button — only for instructor view; category uses the All chip */}
      {instructorId && (
        <button className="courses-header__back" onClick={() => navigate("/courses")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Browse all courses
        </button>
      )}

      {/* Header */}
      <div className="courses-header">
        <div>
          <h1 className="courses-header__title">
            {instructorName
              ? `Courses by ${instructorName}`
              : category
              ? `${categoryName ?? category} Courses`
              : "All Courses"}
            <span className="courses-header__accent">✦</span>
          </h1>
        </div>
      </div>

      {/* Category chips */}
      {!instructorId && categories.length > 0 && (
        <div className="cat-chips">
          <button
            className={`cat-chip${!category ? " cat-chip--active" : ""}`}
            onClick={() => navigate("/courses")}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`cat-chip${category === cat.slug ? " cat-chip--active" : ""}`}
              onClick={() => navigate(`/courses?category=${cat.slug}&name=${encodeURIComponent(cat.name)}`)}
            >
              {cat.name}
              {cat.courses_count > 0 && (
                <span className="cat-chip__count">{cat.courses_count}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
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

      {/* Filters */}
      <div className="filters">
        {/* Search */}
        <div className="filters__search-wrap">
          <span className="filters__search-icon">⌕</span>
          <input
            className="filters__search"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Level dropdown */}
        <div className="filter-select-wrap">
          <svg className="filter-select__icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4h20M6 12h12M10 20h4" />
          </svg>
          <select
            className="filter-select"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            <option value="All">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <svg className="filter-select__chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>

        {/* Free only toggle */}
        <button
          className={`filter-free-btn${freeOnly ? " filter-free-btn--active" : ""}`}
          onClick={() => setFreeOnly((v) => !v)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={freeOnly ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
            <path d="M12 6v12M8 10h6a2 2 0 0 1 0 4H8" />
          </svg>
          Free Courses
        </button>
      </div>

      {/* Grid */}
      <div className="courses-grid mt-0 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: SKELETON_COUNT }).map((_, i) => <SkeletonCard key={i} />)
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__icon">📚</span>
            <p>{search || level !== "All" || freeOnly ? "No courses match your filters." : "No courses available."}</p>
            <button className="empty-state__clear" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        ) : (
          filtered.map((course, i) => {
            const src = resolveUrl(course.thumbnail_url);
            const lvl = course.level?.toLowerCase() ?? "beginner";
            const tint = LEVEL_COLORS[lvl] ?? LEVEL_COLORS.beginner;
            const isFree = Number(course.price) === 0;
            const slug = course.slug ?? String(course.id);
            return (
              <div
                key={course.id}
                className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-e1 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card dark:border-slate-700 dark:bg-slate-800"
                style={{ animationDelay: `${(i % 3) * 90}ms` }}
                onClick={() => navigate(`/courses/${slug}`)}
              >
                {/* Thumbnail */}
                <div className="relative overflow-hidden">
                  {src ? (
                    <img src={src} alt={course.title} className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className={`flex h-48 w-full items-center justify-center bg-gradient-to-br ${tint}`}>
                      <span className="text-4xl">🎓</span>
                    </div>
                  )}
                  <span className={`absolute left-3 top-3 rounded-lg px-2.5 py-1 text-[11px] font-bold text-white shadow ${isFree ? "bg-emerald-500" : "bg-brand"}`}>
                    {isFree ? "Free" : `$${course.price}`}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggle({ id: course.id, slug: course.slug, title: course.title, thumbnail_url: course.thumbnail_url, price: course.price, level: course.level, instructor: course.instructor ?? null }); }}
                    className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full glass text-slate-600 transition-colors hover:text-rose-500"
                    aria-label="Add to wishlist"
                  >
                    <Heart className={`h-4 w-4 ${isWishlisted(course.id) ? "fill-rose-500 text-rose-500" : ""}`} />
                  </button>
                  <span className="absolute bottom-3 left-3 rounded-md glass px-2 py-1 text-[11px] font-semibold ink capitalize">
                    {course.level}
                  </span>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2">
                    <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600">
                      {(course.instructor?.name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[13px] muted2 truncate">{course.instructor?.name ?? "Instructor"}</span>
                    {(course.reviews_count ?? 0) > 0 && (
                      <span className="ml-auto flex items-center gap-1 text-[13px] font-bold text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {course.reviews_count}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 font-display text-[17px] font-bold leading-snug ink line-clamp-2">
                    {course.title}
                  </h3>

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] muted2">
                    <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 brand-blue" /> {course.sections_count ?? 0} sections</span>
                    <span className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5 brand-blue" /> {course.students_count ?? 0} students</span>
                    {course.language && <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 brand-blue" /> {course.language}</span>}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-700">
                    <span className="font-display text-xl font-extrabold ink">
                      {isFree ? "Free" : `$${course.price}`}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/courses/${slug}`); }}
                      className="inline-flex items-center gap-1 rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white transition-all hover:gap-2 hover:bg-blue-700"
                    >
                      Enroll <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-[11.5px] muted2">
                    <Award className="h-3.5 w-3.5 text-emerald-500" /> Certificate included
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && lastPage > 1 && filtered.length > 0 && (
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Page <span className="font-semibold text-slate-700 dark:text-slate-200">{page}</span> of{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">{lastPage}</span>
            {total > 0 && <> &nbsp;·&nbsp; {total} courses</>}
          </p>
          <div className="flex items-center gap-1">
            {/* Prev */}
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-blue-500 dark:hover:text-blue-400"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>

            {pageNumbers().map((p, i) =>
              p === "…" ? (
                <span key={`ellipsis-${i}`} className="flex h-9 w-9 items-center justify-center text-sm text-slate-400">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold transition ${
                    p === page
                      ? "border-blue-500 bg-blue-600 text-white shadow-glow"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:text-blue-400"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            {/* Next */}
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page === lastPage}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-blue-500 dark:hover:text-blue-400"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default Courses;
