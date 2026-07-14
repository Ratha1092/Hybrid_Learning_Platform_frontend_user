import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Star, Clock, BookOpen, BarChart3, Heart, Award } from "lucide-react";
import { courseService, type Course } from "../services/courseService";
import { Reveal } from "../utils/anim";
import { useProtectedWishlist } from "../hooks/useProtectedWishlist";

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

export default function FeaturedCourses() {
  const navigate = useNavigate();
  const { toggle, isWishlisted } = useProtectedWishlist();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    courseService.getAll()
      .then(({ data }) => {
        const list = (data.data as unknown as Course[]) ?? [];
        setCourses(list.slice(0, 9));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Build tabs from unique categories
  const tabs = ["All", ...Array.from(new Set(courses.map((c) => c.category?.name).filter(Boolean)))].slice(0, 6) as string[];
  const shown = activeTab === "All" ? courses : courses.filter((c) => c.category?.name === activeTab);
  const displayList = shown.length ? shown : courses;

  return (
    <section className="bg-white dark:bg-slate-900">
      <div className="mx-auto max-w-[1400px] px-4 py-20 sm:px-6 md:py-28">
        <Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold brand-blue">Featured courses</p>
            <h2 className="font-display text-[32px] font-extrabold ink sm:text-[40px]">
              Most popular this week
            </h2>
          </div>
          <button
            onClick={() => navigate("/courses")}
            className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold ink transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-blue-400"
          >
            View all courses <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </Reveal>

        {/* Filter tabs */}
        <div className="no-scrollbar mt-8 flex gap-2.5 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`shrink-0 whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                activeTab === t
                  ? "bg-brand text-white shadow-glow"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-500"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : displayList.map((course, i) => {
              const src = resolveUrl(course.thumbnail_url);
              const lvl = course.level?.toLowerCase() ?? "beginner";
              const tint = LEVEL_COLORS[lvl] ?? LEVEL_COLORS.beginner;
              const isFree = Number(course.price) === 0;
              const slug = course.slug ?? String(course.id);

              return (
                <Reveal as="article" key={course.id} delay={(i % 3) * 90}>
                  <div
                    className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-e1 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card dark:border-slate-700 dark:bg-slate-800"
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
                </Reveal>
              );
            })}
        </div>
      </div>
    </section>
  );
}
