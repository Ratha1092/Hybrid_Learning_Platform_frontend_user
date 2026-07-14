import { useEffect, useState } from "react";
import { Users, BookOpen, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Reveal } from "../../utils/anim";
import api from "../../api/axios";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

interface Instructor {
  id: number;
  name: string;
  avatar: string | null;
  bio: string | null;
  courses: number;
  students: number;
}

function resolveAvatar(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

function InstructorCard({ m }: { m: Instructor }) {
  const [imgErr, setImgErr] = useState(false);
  const src = resolveAvatar(m.avatar);
  const hasImg = !!src && !imgErr;
  const initial = m.name.charAt(0).toUpperCase();

  return (
    <Link
      to={`/courses?instructor=${m.id}&name=${encodeURIComponent(m.name)}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-e1 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="relative overflow-hidden">
        {hasImg ? (
          <img
            src={src!}
            alt={m.name}
            className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="flex h-56 w-full items-center justify-center grad-blue transition-transform duration-500 group-hover:scale-105">
            <span className="font-display text-6xl font-extrabold text-white/80">{initial}</span>
          </div>
        )}
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full glass px-2.5 py-1 text-[12px] font-bold text-blue-600">
          <BookOpen className="h-3.5 w-3.5" /> {m.courses}
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-display text-[16px] font-bold ink">{m.name}</h3>
        {m.bio && (
          <p className="mt-0.5 line-clamp-1 text-[13px] muted2">{m.bio}</p>
        )}
        <p className="mt-3 flex items-center gap-1.5 text-[12.5px] muted2">
          <Users className="h-3.5 w-3.5 brand-blue" />
          {m.students.toLocaleString()} students
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
        <div className="skeleton skeleton-line skeleton-line--md mb-3" />
        <div className="skeleton skeleton-line skeleton-line--sm" />
      </div>
    </div>
  );
}

export default function TopInstructors() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/instructors?limit=8")
      .then((res) => setInstructors((res.data.data ?? []).slice(0, 8)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && instructors.length === 0) return null;

  return (
    <section className="bg-[#EEF1F6] dark:bg-slate-950 py-20 sm:py-24">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <Reveal className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-end">
          <div className="text-center sm:text-left">
            <p className="mb-2 text-sm font-semibold brand-blue">Meet the mentors</p>
            <h2 className="font-display text-[32px] font-extrabold ink sm:text-[40px]">
              Learn from top instructors
            </h2>
          </div>
          <Link
            to="/instructors"
            className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold ink shadow-e1 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-blue-400"
          >
            View all instructors <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Reveal key={i} delay={i * 80}>
                  <SkeletonCard />
                </Reveal>
              ))
            : instructors.map((m, i) => (
                <Reveal key={m.id} delay={i * 80}>
                  <InstructorCard m={m} />
                </Reveal>
              ))}
        </div>
      </div>
    </section>
  );
}
