import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookOpen, Users, Search, GraduationCap } from "lucide-react";
import api from "../../api/axios";
import { categoryService, type Category } from "../../services/categoryService";
import { type Course } from "../../services/courseService";
import { Reveal } from "../../utils/anim";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
const PER_PAGE = 12;

interface Instructor {
  id: number;
  name: string;
  avatar: string | null;
  headline: string | null;
  bio: string | null;
  courses: number;
  students: number;
}

interface InstructorPage {
  data: Instructor[];
  current_page: number;
  last_page: number;
  total: number;
}

function resolveAvatar(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

// Module-level caches
let _cachedTop: Instructor[] | null = null;
let _cachedCategories: Category[] | null = null;
let _flatStore: { key: string; instructors: Instructor[] } | null = null;
// Detected backend page size (set on first paginated response to avoid sequential probing)
let _batchSize: number | null = null;
// Monotonically-increasing counter: every load() call gets its own gen.
// Before setting any React state, a load checks gen === _loadGen.
// If a newer load started while this one was awaiting, the check fails → discard.
let _loadGen = 0;

function extractInstructors(raw: unknown, limit?: number): Instructor[] {
  const arr = Array.isArray(raw)
    ? (raw as Instructor[])
    : Array.isArray((raw as { data?: unknown })?.data)
    ? ((raw as { data: Instructor[] }).data)
    : [];
  return limit ? arr.slice(0, limit) : arr;
}

// ─── Module-level prefetches ────────────────────────────────────────────────
// All three requests fire the instant the module is imported (before the
// component mounts). useEffect hooks just attach to these existing Promises —
// no duplicate requests, and the data is often already resolved by first render.

// 1. Top instructors — fetch more than 4 so we can sort client-side accurately
const _topPromise: Promise<Instructor[]> =
  api.get("/instructors", {
    params: { per_page: 10, page: 1, sort_by: "students", sort_order: "desc" },
  })
    .then((res) => {
      const raw = extractInstructors(res.data.data);
      const data = [...raw].sort((a, b) => b.students - a.students).slice(0, 4);
      _cachedTop = data;
      return data;
    })
    .catch(() => []);

// 2. Main grid page 1 — fire page-1 + page-2 in parallel so the component
//    never needs to do sequential probing on first load.
type MainPageResult = { items: Instructor[]; total: number; lastPage: number };
let _mainPageResult: MainPageResult | null = null;

const _mainPromise: Promise<MainPageResult | null> = (async () => {
  try {
    const [res1, res2] = await Promise.all([
      api.get("/instructors", { params: { per_page: PER_PAGE, page: 1 } }),
      api.get("/instructors", { params: { per_page: Math.ceil(PER_PAGE / 2), page: 2 } })
        .catch(() => null),
    ]);
    const raw1 = res1.data.data as unknown;
    if (Array.isArray(raw1)) {
      const all = raw1 as Instructor[];
      _flatStore = { key: "all", instructors: all };
      const lp = Math.max(1, Math.ceil(all.length / PER_PAGE));
      _mainPageResult = { items: all.slice(0, PER_PAGE), total: all.length, lastPage: lp };
      return _mainPageResult;
    }
    const p1 = raw1 as InstructorPage;
    let items = p1?.data ?? [];
    const total = p1?.total ?? items.length;
    const apiLastPage = p1?.last_page ?? 1;
    if (items.length > 0 && items.length < PER_PAGE && res2) {
      _batchSize = items.length;
      items = [...items, ...((res2.data.data as InstructorPage)?.data ?? [])].slice(0, PER_PAGE);
      _mainPageResult = { items, total, lastPage: Math.ceil(total / PER_PAGE) };
    } else {
      _mainPageResult = { items, total, lastPage: apiLastPage };
    }
    return _mainPageResult;
  } catch {
    return null;
  }
})();

// 3. Categories
const _categoriesPromise: Promise<Category[]> =
  categoryService.getAll()
    .then(({ data }) => { _cachedCategories = data.data; return data.data; })
    .catch(() => []);

function resolveImg(instructor: Instructor) {
  return resolveAvatar(instructor.avatar);
}

function InstructorAvatar({ instructor, height }: { instructor: Instructor; height: string }) {
  const [imgErr, setImgErr] = useState(false);
  const src = resolveImg(instructor);
  const hasImg = !!src && !imgErr;
  const initial = instructor.name.charAt(0).toUpperCase();
  return hasImg ? (
    <img
      src={src!}
      alt={instructor.name}
      className={`${height} w-full object-cover transition-transform duration-500 group-hover:scale-105`}
      onError={() => setImgErr(true)}
    />
  ) : (
    <div className={`${height} flex w-full items-center justify-center grad-blue transition-transform duration-500 group-hover:scale-105`}>
      <span className="font-display text-6xl font-extrabold text-white/80">{initial}</span>
    </div>
  );
}

function FeaturedCard({ instructor, rank }: { instructor: Instructor; rank: number }) {
  return (
    <Link
      to={`/courses?instructor=${instructor.id}&name=${encodeURIComponent(instructor.name)}`}
      className="group relative block overflow-hidden rounded-2xl border-2 border-blue-200 bg-white shadow-soft transition-all duration-300 hover:-translate-y-2 hover:shadow-card dark:border-blue-900/50 dark:bg-slate-800"
    >
      <div className="relative overflow-hidden">
        <InstructorAvatar instructor={instructor} height="h-52" />
        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold text-white shadow-glow">
          #{rank} Top
        </span>
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full glass px-2.5 py-1 text-[12px] font-bold text-blue-600">
          <BookOpen className="h-3.5 w-3.5" /> {instructor.courses}
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-display text-[17px] font-bold ink">{instructor.name}</h3>
        {(instructor.headline ?? instructor.bio) && (
          <p className="mt-0.5 line-clamp-1 text-[13px] muted2">{instructor.headline ?? instructor.bio}</p>
        )}
        <p className="mt-3 flex items-center gap-1.5 text-[12.5px] muted2">
          <Users className="h-3.5 w-3.5 brand-blue" />
          {instructor.students.toLocaleString()} students
        </p>
      </div>
    </Link>
  );
}

function InstructorCard({ instructor }: { instructor: Instructor }) {
  return (
    <Link
      to={`/courses?instructor=${instructor.id}&name=${encodeURIComponent(instructor.name)}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-e1 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="relative overflow-hidden">
        <InstructorAvatar instructor={instructor} height="h-44" />
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full glass px-2.5 py-1 text-[12px] font-bold text-blue-600">
          <BookOpen className="h-3.5 w-3.5" /> {instructor.courses}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-display text-[15px] font-bold ink">{instructor.name}</h3>
        {(instructor.headline ?? instructor.bio) && (
          <p className="mt-0.5 line-clamp-1 text-[12.5px] muted2">{instructor.headline ?? instructor.bio}</p>
        )}
        <p className="mt-2.5 flex items-center gap-1.5 text-[12px] muted2">
          <Users className="h-3 w-3 brand-blue" />
          {instructor.students.toLocaleString()} students
        </p>
      </div>
    </Link>
  );
}

function SkeletonFeatured() {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-blue-100 bg-white shadow-soft dark:border-blue-900/30 dark:bg-slate-800">
      <div className="h-52 w-full animate-pulse bg-slate-200 dark:bg-slate-700" />
      <div className="p-5">
        <div className="mb-2 h-4 w-3/4 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="mb-3 h-3 w-1/2 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-1/3 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-e1 dark:border-slate-700 dark:bg-slate-800">
      <div className="h-44 w-full animate-pulse bg-slate-200 dark:bg-slate-700" />
      <div className="p-4">
        <div className="mb-2 h-4 w-3/4 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="mb-2.5 h-3 w-1/2 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-1/3 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}

export default function Instructors() {
  const [topInstructors, setTopInstructors] = useState<Instructor[]>(_cachedTop ?? []);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [categories, setCategories] = useState<Category[]>(_cachedCategories ?? []);
  const [loading, setLoading] = useState(true);
  const [topLoading, setTopLoading] = useState(!_cachedTop);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category");
  const isMounted = useRef(false);

  // Load paginated instructor list
  const load = async (currentPage = 1, currentSearch = "", currentCategory = "") => {
    // Each call gets a unique generation. Any await point checks this; if a
    // newer load has started by the time we're about to write state, we discard.
    const myGen = ++_loadGen;
    const stale = () => _loadGen !== myGen;

    const cacheKey = currentCategory ? `cat:${currentCategory}` : "all";

    // Client-side pagination: reuse flat store if key matches (synchronous — never stale)
    if (_flatStore?.key === cacheKey && !currentSearch) {
      const all = _flatStore.instructors;
      const lp = Math.max(1, Math.ceil(all.length / PER_PAGE));
      setInstructors(all.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE));
      setLastPage(lp);
      setTotal(all.length);
      setPage(currentPage);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const baseParams: Record<string, unknown> = {};
      if (currentSearch) baseParams.search = currentSearch;

      let items: Instructor[] = [];
      let apiTotal = 0;
      let apiLastPage = 1;

      // ── Category mode ──────────────────────────────────────────────────────
      // /instructors doesn't support category filtering, so we derive the list
      // from GET /courses?category_id=X which returns full Course objects
      // (including instructor: { id, name, avatar }).
      if (currentCategory && !currentSearch) {
        const catObj = _cachedCategories?.find((c) => c.slug === currentCategory);
        const res = await api.get("/courses", {
          params: { category_id: catObj?.id ?? currentCategory, per_page: 100, page: 1 },
        });
        if (stale()) return;

        const rawCourses = (res.data as { data?: unknown })?.data;
        const courses: Course[] = (
          Array.isArray(rawCourses)
            ? rawCourses
            : Array.isArray((rawCourses as { data?: unknown })?.data)
            ? (rawCourses as { data: Course[] }).data
            : []
        ) as Course[];

        const seen = new Map<number, Instructor>();
        for (const c of courses) {
          if (!c.instructor?.id) continue;
          const { id, name, avatar } = c.instructor;
          if (!seen.has(id)) {
            seen.set(id, { id, name, avatar: avatar ?? null, headline: null, bio: null, courses: 0, students: 0 });
          }
          const inst = seen.get(id)!;
          inst.courses++;
          inst.students += c.students_count ?? 0;
        }
        const all = [...seen.values()];
        _flatStore = { key: cacheKey, instructors: all };
        const lp = Math.max(1, Math.ceil(all.length / PER_PAGE));
        setInstructors(all.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE));
        setLastPage(lp);
        setTotal(all.length);
        setPage(currentPage);
        setLoading(false);
        return;
      }

      // ── First-page cache (no filter) ───────────────────────────────────────
      if (currentPage === 1 && !currentSearch && !currentCategory) {
        const cached = _mainPageResult ?? (await _mainPromise);
        if (stale()) return;
        if (cached !== null) {
          setInstructors(cached.items);
          setLastPage(cached.lastPage);
          setTotal(cached.total);
          setPage(1);
          setLoading(false);
          return;
        }
      }

      if (_batchSize && !currentSearch) {
        // ── Fast path: batch size known → fire all pages in parallel ──────────
        const pagesPerFrontend = Math.ceil(PER_PAGE / _batchSize);
        const backendStart = (currentPage - 1) * pagesPerFrontend + 1;
        const results = await Promise.all(
          Array.from({ length: pagesPerFrontend }, async (_, i) => {
            try {
              const r = await api.get("/instructors", {
                params: { ...baseParams, per_page: _batchSize, page: backendStart + i },
              });
              const raw = r.data.data as InstructorPage;
              if (i === 0) { apiTotal = raw?.total ?? 0; apiLastPage = raw?.last_page ?? 1; }
              return (raw?.data ?? []) as Instructor[];
            } catch { return [] as Instructor[]; }
          })
        );
        if (stale()) return;
        items = results.flat().slice(0, PER_PAGE);
        setLastPage(Math.ceil(apiTotal / PER_PAGE));
      } else {
        // ── Probe path: fire page 1 + speculative page 2 simultaneously ───────
        const [res1, res2] = await Promise.all([
          api.get("/instructors", { params: { ...baseParams, per_page: PER_PAGE, page: 1 } }),
          !currentSearch
            ? api.get("/instructors", {
                params: { ...baseParams, per_page: Math.ceil(PER_PAGE / 2), page: 2 },
              }).catch(() => null)
            : Promise.resolve(null),
        ]);
        if (stale()) return;

        const raw1 = res1.data.data as unknown;
        if (Array.isArray(raw1)) {
          const all = raw1 as Instructor[];
          _flatStore = { key: cacheKey, instructors: all };
          const lp = Math.max(1, Math.ceil(all.length / PER_PAGE));
          setInstructors(all.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE));
          setLastPage(lp);
          setTotal(all.length);
          setPage(currentPage);
          setLoading(false);
          return;
        }

        const p1 = raw1 as InstructorPage;
        items = p1?.data ?? [];
        apiTotal = p1?.total ?? items.length;
        apiLastPage = p1?.last_page ?? 1;

        if (items.length > 0 && items.length < PER_PAGE && !currentSearch && res2) {
          _batchSize = items.length;
          const p2 = res2.data.data as InstructorPage;
          items = [...items, ...(p2?.data ?? [])].slice(0, PER_PAGE);
          setLastPage(Math.ceil(apiTotal / PER_PAGE));
        } else {
          setLastPage(apiLastPage);
        }
      }

      setInstructors(items);
      setTotal(apiTotal);
      setPage(currentPage);
    } catch {
      if (!stale()) {
        setError("Failed to load instructors. Please try again.");
        setInstructors([]);
        setTotal(0);
        setLastPage(1);
      }
    }
    if (!stale()) setLoading(false);
  };

  // Load top instructors — reuse the module-level prefetch Promise (no duplicate request)
  useEffect(() => {
    if (_cachedTop) { setTopInstructors(_cachedTop); setTopLoading(false); return; }
    _topPromise.then((data) => setTopInstructors(data)).finally(() => setTopLoading(false));
  }, []);

  // Initial load + category change─
  useEffect(() => {
    isMounted.current = false;
    load(1, search, activeCategory ?? "");
  }, [activeCategory]);

  // Categories — reuse module-level prefetch, no duplicate request
  useEffect(() => {
    if (_cachedCategories) { setCategories(_cachedCategories); return; }
    _categoriesPromise.then((data) => { if (data.length) setCategories(data); });
  }, []);

  // Debounced searc
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    const t = setTimeout(() => load(1, search, activeCategory ?? ""), 400);
    return () => clearTimeout(t);
  }, [search]);

  const goToPage = (p: number) => {
    if (p < 1 || p > lastPage || p === page) return;
    load(p, search, activeCategory ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pageNumbers = (): (number | "…")[] => {
    if (lastPage <= 7) return Array.from({ length: lastPage }, (_, i) => i + 1);
    const pages: (number | "…")[] = [1];
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(lastPage - 1, page + 1); i++) pages.push(i);
    if (page < lastPage - 2) pages.push("…");
    pages.push(lastPage);
    return pages;
  };

  const setCategory = (slug: string | null) => {
    setSearch("");
    setInstructors([]);
    setTotal(0);
    setLastPage(1);
    _flatStore = null;
    if (slug) setSearchParams({ category: slug });
    else setSearchParams({});
  };

  const showTopBand = !search && !activeCategory;

  return (
    <>
      {/* Hero */}
      <div className="relative overflow-hidden bg-[#EEF1F6] py-10 dark:bg-slate-900 sm:py-14">
        <div className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-100 opacity-50 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-[400px] w-[400px] rounded-full bg-cyan-100 opacity-40 blur-[80px]" />
        <div className="relative mx-auto max-w-[1400px] px-4 text-center sm:px-6">
          <Reveal>
            <p className="mb-2 text-sm font-semibold brand-blue">Meet the mentors</p>
            <h1 className="font-display text-[32px] font-extrabold ink sm:text-[40px]">
              Learn from top instructors
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base muted2">
              Industry professionals and seasoned educators who bring real-world experience to every course they teach.
            </p>
          </Reveal>
          <Reveal delay={100} className="mx-auto mt-8 max-w-md">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search instructors…"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 shadow-e1 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-blue-500"
              />
            </div>
          </Reveal>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 pb-24 pt-10 sm:px-6">

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <GraduationCap className="h-12 w-12 text-slate-300" />
            <p className="text-sm muted2">{error}</p>
            <button
              className="rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-blue-700"
              onClick={() => { _flatStore = null; load(1, search, activeCategory ?? ""); }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Top Instructors band */}
        {showTopBand && !error && (
          <div className="mb-14">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <span className="text-lg">⭐</span>
              </div>
              <div>
                <h2 className="font-display text-[22px] font-bold ink">Top Instructors</h2>
                <p className="text-[13px] muted2">Ranked by student enrollment</p>
              </div>
            </div>
            <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
              {topLoading
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonFeatured key={i} />)
                : topInstructors.map((inst, i) => (
                    <Reveal key={inst.id} delay={i * 80}>
                      <FeaturedCard instructor={inst} rank={i + 1} />
                    </Reveal>
                  ))}
            </div>
          </div>
        )}

        {/* All Instructor─ */}
        {!error && (
          <>
            {/* Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-[20px] font-bold ink">
                  {activeCategory
                    ? (categories.find((c) => c.slug === activeCategory)?.name ?? "Category")
                    : search
                    ? "Search results"
                    : "All Instructors"}
                </h2>
                {!loading && total > 0 && (
                  <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-[12px] font-semibold muted2 dark:border-slate-700">
                    {total.toLocaleString()}
                  </span>
                )}
              </div>
              {(search || activeCategory) && (
                <button
                  onClick={() => { setSearch(""); setCategory(null); }}
                  className="text-[13px] font-semibold brand-blue hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Category chips — single scrollable row */}
            {categories.length > 0 && (
              <div className="mb-7 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button
                  onClick={() => setCategory(null)}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
                    !activeCategory
                      ? "border-blue-500 bg-brand text-white shadow-glow"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:text-blue-400"
                  }`}
                >
                  All
                </button>
                {categories.slice(0, 12).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.slug)}
                    className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
                      activeCategory === cat.slug
                        ? "border-blue-500 bg-brand text-white shadow-glow"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:text-blue-400"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Skeleton */}
            {loading && (
              <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: PER_PAGE }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* Empty */}
            {!loading && instructors.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-20 text-center">
                <Users className="h-12 w-12 text-slate-300" />
                <p className="text-sm muted2">
                  {search || activeCategory ? "No instructors match your filters." : "No instructors available yet."}
                </p>
              </div>
            )}

            {/* Grid */}
            {!loading && instructors.length > 0 && (
              <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
                {instructors.map((inst, i) => (
                  <Reveal key={inst.id} delay={i * 60}>
                    <InstructorCard instructor={inst} />
                  </Reveal>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && lastPage > 1 && instructors.length > 0 && (
              <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Page <span className="font-semibold text-slate-700 dark:text-slate-200">{page}</span> of{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{lastPage}</span>
                  {total > 0 && <> &nbsp;·&nbsp; {total.toLocaleString()} instructors</>}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-blue-500 dark:hover:text-blue-400"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  {pageNumbers().map((p, i) =>
                    p === "…" ? (
                      <span key={`e-${i}`} className="flex h-9 w-9 items-center justify-center text-sm text-slate-400">…</span>
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
          </>
        )}
      </div>
    </>
  );
}
