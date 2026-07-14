import { ArrowRight, Play, CheckCircle2, Users, BookOpen, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "../assets/image1.png";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";
import { useCountUp } from "../utils/anim";
import { usePlatformStats } from "../utils/usePlatformStats";

function StatPill({ end, suffix, label }: { end: number; suffix: string; label: string }) {
  const { ref, val } = useCountUp(end, 1400);
  return (
    <div className="text-center">
      <span ref={ref} className="block font-display text-2xl font-extrabold text-slate-900 dark:text-white">
        {val.toLocaleString()}{suffix}
      </span>
      <span className="text-[12px] text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
}

function Hero() {
  const { isAuthenticated } = useAuth();
  const { openRegister } = useAuthModal();
  const stats = usePlatformStats();

  const students = stats?.total_students    ?? 0; // 0 while loading; real value triggers count-up
  const courses  = stats?.total_courses     ?? 0;
  const instrs   = stats?.total_instructors ?? 0;

  return (
    <section className="hero-section grad-navy relative overflow-hidden pt-16 pb-24 sm:pt-20 sm:pb-32">
      <div className="pointer-events-none absolute -top-40 right-0 h-[620px] w-[620px] rounded-full bg-blue-500/[0.06] blur-3xl dark:bg-blue-600/20" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-80 w-80 rounded-full bg-cyan-400/[0.06] blur-3xl dark:bg-cyan-500/10" />
      <div className="pointer-events-none absolute left-1/3 top-1/2 h-48 w-48 rounded-full bg-indigo-400/[0.06] blur-2xl dark:bg-indigo-600/10" />

      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">

          {/* Left */}
          <div className="max-w-xl">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50 px-3.5 py-1.5 text-[13px] font-semibold text-blue-600 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-blue-200">
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500 dark:bg-blue-400" />
              Online Learning Platform
            </span>

            <h1 className="font-display text-[40px] font-extrabold leading-tight text-slate-900 dark:text-white sm:text-[56px]">
              <span className="grad-text">Studying</span> Online is now much easier
            </h1>

            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-slate-600 dark:text-slate-300">
              Hybrid Learning is a modern platform that will teach you in a more
              interactive and engaging way.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {isAuthenticated ? (
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-2 rounded-xl grad-blue px-6 py-3.5 text-sm font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5"
                >
                  Start Learning <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <button
                  onClick={openRegister}
                  className="inline-flex items-center gap-2 rounded-xl grad-blue px-6 py-3.5 text-sm font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5"
                >
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </button>
              )}
              {/* <button className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-6 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">
                <span className="grid h-8 w-8 place-items-center rounded-full grad-blue shadow-glow">
                  <Play className="h-3.5 w-3.5 fill-white text-white" />
                </span>
                Watch how it works
              </button> */}
            </div>

            {/* Stats row */}
            <div className="mt-10 flex items-center gap-6 rounded-2xl border border-slate-100 bg-white px-6 py-4 shadow-e1 dark:border-white/[0.12] dark:bg-white/[0.08] dark:shadow-none sm:gap-8">
              <StatPill end={students} suffix="+" label="Students" />
              <div className="h-8 w-px bg-slate-200 dark:bg-white/10" />
              <StatPill end={courses}  suffix="+" label="Courses" />
              <div className="h-8 w-px bg-slate-200 dark:bg-white/10" />
              <StatPill end={instrs}   suffix="+" label="Instructors" />
            </div>
          </div>

          {/* Right — hero image */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-4 rounded-[40px] bg-blue-500/[0.08] blur-2xl dark:bg-blue-600/25" />

            <img
              src={heroImage}
              alt="Student learning online"
              className="relative z-10 mx-auto h-[460px] w-full max-w-md rounded-[32px] object-cover shadow-card"
            />

            {/* Floating badge — top left */}
            <div className="animate-floaty absolute -left-8 top-12 z-20 flex items-center gap-3 rounded-2xl glass px-4 py-3 shadow-card">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </span>
              <div className="leading-tight">
                <p className="text-[11px] text-slate-500">Course Completed</p>
                <p className="font-display text-[14px] font-bold text-slate-900">User Experience Design</p>
              </div>
            </div>

            {/* Floating badge — bottom right (real student count) */}
            <div className="animate-floaty2 absolute -bottom-4 -right-6 z-20 rounded-2xl glass px-4 py-3 shadow-card">
              <p className="text-[11px] text-slate-500">Total learners enrolled</p>
              <p className="flex items-center gap-1 font-display text-xl font-extrabold text-slate-900">
                <Users className="h-4 w-4 text-blue-600" />
                {students > 0 ? `${students.toLocaleString()}+` : "—"}
              </p>
            </div>

            {/* Floating badge — right middle */}
            <div className="animate-floaty absolute right-0 top-1/2 z-20 -translate-y-1/2 translate-x-6 rounded-2xl glass px-4 py-3 shadow-card">
              <p className="text-[11px] text-slate-500">Live Teaching</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {[BookOpen, GraduationCap].map((Icon, i) => (
                    <span key={i} className="grid h-6 w-6 place-items-center rounded-full bg-blue-100 ring-2 ring-white dark:ring-slate-700">
                      <Icon className="h-3 w-3 text-blue-600" />
                    </span>
                  ))}
                </div>
                <p className="font-display text-[13px] font-bold text-slate-900">Starting soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
