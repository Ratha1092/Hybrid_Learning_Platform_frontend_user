import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Users, Search, GraduationCap } from "lucide-react";
import api from "../../api/axios";
import { Reveal } from "../../utils/anim";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

interface Instructor {
  id: number;
  name: string;
  avatar: string | null;
  headline: string | null;
  bio: string | null;
  courses: number;
  students: number;
}

function resolveAvatar(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

function InstructorCard({ instructor }: { instructor: Instructor }) {
  const [imgErr, setImgErr] = useState(false);
  const src = resolveAvatar(instructor.avatar);
  const hasImg = !!src && !imgErr;
  const initial = instructor.name.charAt(0).toUpperCase();
  const subtitle = instructor.headline ?? instructor.bio;

  return (
    <Link
      to={`/courses?instructor=${instructor.id}&name=${encodeURIComponent(instructor.name)}`}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-e1 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card block dark:border-slate-700 dark:bg-slate-800"
    >
      {/* Photo area */}
      <div className="relative overflow-hidden">
        {hasImg ? (
          <img
            src={src!}
            alt={instructor.name}
            className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="flex h-56 w-full items-center justify-center grad-blue transition-transform duration-500 group-hover:scale-105">
            <span className="font-display text-6xl font-extrabold text-white/80">{initial}</span>
          </div>
        )}
        {/* Course count badge */}
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full glass px-2.5 py-1 text-[12px] font-bold text-blue-600">
          <BookOpen className="h-3.5 w-3.5" /> {instructor.courses}
        </span>
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="font-display text-[16px] font-bold ink">{instructor.name}</h3>
        {subtitle && (
          <p className="mt-0.5 line-clamp-1 text-[13px] muted2">{subtitle}</p>
        )}
        <p className="mt-3 flex items-center gap-1.5 text-[12.5px] muted2">
          <Users className="h-3.5 w-3.5 brand-blue" />
          {instructor.students.toLocaleString()} students
        </p>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-e1 dark:border-slate-700 dark:bg-slate-800">
      <div className="skeleton h-56 w-full" />
      <div className="p-5">
        <div className="skeleton skeleton-line skeleton-line--lg mb-2" />
        <div className="skeleton skeleton-line skeleton-line--md mb-4" />
        <div className="skeleton skeleton-line skeleton-line--sm" />
      </div>
    </div>
  );
}

export default function Instructors() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [filtered, setFiltered] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  function load() {
    setLoading(true);
    setError(null);
    api
      .get("/instructors")
      .then((res) => {
        const data: Instructor[] = res.data.data ?? [];
        setInstructors(data);
        setFiltered(data);
      })
      .catch(() => setError("Failed to load instructors. Please try again."))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    setFiltered(
      q
        ? instructors.filter(
            (i) =>
              i.name.toLowerCase().includes(q) ||
              i.headline?.toLowerCase().includes(q) ||
              i.bio?.toLowerCase().includes(q)
          )
        : instructors
    );
  }, [search, instructors]);

  return (
    <>
      {/* Hero */}
      <div className="relative overflow-hidden bg-[#EEF1F6] py-16 dark:bg-slate-900 sm:py-20">
        <div className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-100 opacity-50 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-[400px] w-[400px] rounded-full bg-cyan-100 opacity-40 blur-[80px]" />
        <div className="relative mx-auto max-w-[1400px] px-4 text-center sm:px-6">
          <Reveal>
            <p className="mb-2 text-sm font-semibold brand-blue">Meet the mentors</p>
            <h1 className="font-display text-[32px] font-extrabold ink sm:text-[40px]">
              Learn from top instructors
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base muted2">
              Our instructors are industry professionals and seasoned educators who bring real-world experience to every course they teach.
            </p>
          </Reveal>

          {/* Search */}
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

      {/* Body */}
      <section className="mx-auto max-w-[1400px] px-4 pb-20 pt-8 sm:px-6 dark:text-slate-200">

        {/* Loading */}
        {loading && (
          <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <GraduationCap className="h-12 w-12 text-slate-300" />
            <p className="text-sm muted2">{error}</p>
            <button
              className="rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-blue-700"
              onClick={load}
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <Users className="h-12 w-12 text-slate-300" />
            <p className="text-sm muted2">
              {search ? "No instructors match your search." : "No instructors available yet."}
            </p>
            {search && (
              <button
                className="text-sm font-semibold brand-blue hover:underline"
                onClick={() => setSearch("")}
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Count */}
        {!loading && !error && filtered.length > 0 && (
          <p className="mb-6 text-sm muted2">
            {search
              ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""} for "${search}"`
              : `${filtered.length} instructor${filtered.length !== 1 ? "s" : ""}`}
          </p>
        )}

        {/* Grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
            {filtered.map((instructor, i) => (
              <Reveal key={instructor.id} delay={i * 80}>
                <InstructorCard instructor={instructor} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
