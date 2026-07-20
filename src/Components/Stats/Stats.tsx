import { useEffect, useState } from "react";
import { useCountUp, Reveal } from "../../utils/anim";
import api from "../../api/axios";

interface PlatformStats { total_students: number; total_courses: number; total_instructors: number; }

function StatItem({ end, suffix, label, sub }: { end: number; suffix: string; label: string; sub?: string }) {
  const { ref, val } = useCountUp(end);
  return (
    <div className="flex flex-col items-center text-center">
      <span ref={ref} className="block font-display text-[40px] font-extrabold grad-text sm:text-[52px]">
        {val.toLocaleString()}{suffix}
      </span>
      <p className="mt-1 font-display text-[15px] font-bold ink">{label}</p>
      {sub && <p className="mt-0.5 text-[13px] muted2">{sub}</p>}
    </div>
  );
}

export default function Stats() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    api.get("/stats").then((res) => setStats(res.data.data)).catch(() => {});
  }, []);

  const items = [
    { end: stats?.total_students    ?? 0, suffix: "+", label: "Active Students",  sub: "learning every day" },
    { end: stats?.total_courses     ?? 0, suffix: "+", label: "Expert Courses",   sub: "in 15+ categories" },
    { end: stats?.total_instructors ?? 0, suffix: "+", label: "Pro Instructors",  sub: "from top companies" },
    { end: 97,                                suffix: "%", label: "Completion Rate",  sub: "industry-leading" },
  ];

  return (
    <section className="bg-[#EEF1F6] dark:bg-slate-950 py-16 sm:py-20">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <Reveal className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-800">
          <div className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 dark:divide-slate-700">
            {items.map((s, i) => (
              <div key={s.label} className={`flex flex-col items-center px-8 py-10 ${i % 2 === 1 && i < 2 ? "sm:border-l" : ""}`}>
                <StatItem {...s} />
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
