import { Star, Quote } from "lucide-react";
import { Reveal, useCountUp } from "../../utils/anim";
import { usePlatformStats } from "../../utils/usePlatformStats";

const testimonials = [
  {
    name: "Daniel Ortega", role: "UX Designer", company: "Stripe",
    text: "The projects were genuinely job-relevant. I rebuilt my portfolio and landed a design role within two months of finishing my track.",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=70",
  },
  {
    name: "Amara Okafor", role: "Marketing Lead", company: "Notion",
    text: "Clear structure, supportive mentors, and certificates that actually helped in interviews. Easily the best learning platform I've used.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=70",
  },
  {
    name: "Kenji Tanaka", role: "Frontend Developer", company: "Linear",
    text: "Came in with zero experience and now I ship production code confidently. Every module builds cleanly on the last.",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=70",
  },
];

function StatPill({ end, suffix, label }: { end: number; suffix: string; label: string }) {
  const { ref, val } = useCountUp(end);
  return (
    <div className="flex flex-col items-center text-center">
      <span ref={ref} className="font-display text-[30px] font-extrabold text-white sm:text-[38px]">
        {val.toLocaleString()}{suffix}
      </span>
      <p className="mt-1 text-[13px] text-slate-400">{label}</p>
    </div>
  );
}

export default function Testimonials() {
  const stats = usePlatformStats();

  return (
    <section className="grad-navy relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-64 w-64 rounded-full bg-cyan-600/10 blur-3xl" />
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">

        <Reveal className="mx-auto max-w-xl text-center">
          <p className="mb-2 text-sm font-semibold text-blue-300">Student success stories</p>
          <h2 className="font-display text-[32px] font-extrabold text-white sm:text-[40px]">
            Loved by learners worldwide
          </h2>
        </Reveal>

        {/* Real platform stats */}
        <Reveal delay={100} className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-y-8 gap-x-6 sm:grid-cols-4">
          <StatPill end={stats?.total_students    ?? 0} suffix="+" label="Students enrolled" />
          <StatPill end={stats?.total_courses     ?? 0} suffix="+" label="Expert courses" />
          <StatPill end={stats?.total_instructors ?? 0} suffix="+" label="Pro instructors" />
          <div className="flex flex-col items-center text-center">
            <span className="font-display text-[30px] font-extrabold text-white sm:text-[38px]">4.8★</span>
            <p className="mt-1 text-[13px] text-slate-400">Average rating</p>
          </div>
        </Reveal>

        <div className="mx-auto mt-12 border-t border-white/10" />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <div className="flex h-full flex-col rounded-2xl glass-dark p-6 shadow-soft-dark">
                <Quote className="h-8 w-8 text-blue-400/60" fill="currentColor" />
                <p className="mt-4 flex-1 text-[15px] leading-relaxed text-slate-200">"{t.text}"</p>
                <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                  <img src={t.image} alt={t.name} className="h-11 w-11 rounded-full object-cover ring-2 ring-white/20" />
                  <div className="min-w-0">
                    <p className="font-display text-[15px] font-bold text-white">{t.name}</p>
                    <p className="truncate text-[12.5px] text-slate-400">{t.role} · {t.company}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, k) => (
                      <Star key={k} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
