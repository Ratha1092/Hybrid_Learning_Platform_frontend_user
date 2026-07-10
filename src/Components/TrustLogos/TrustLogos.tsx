import { Reveal } from "../../utils/anim";

const partners = [
  { name: "Google",  color: "from-blue-500 to-blue-600" },
  { name: "Stripe",  color: "from-indigo-500 to-indigo-600" },
  { name: "Notion",  color: "from-slate-700 to-slate-800" },
  { name: "Airbnb",  color: "from-rose-500 to-rose-600" },
  { name: "Figma",   color: "from-violet-500 to-violet-600" },
  { name: "Linear",  color: "from-cyan-500 to-blue-600" },
];

export default function TrustLogos() {
  return (
    <section className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
        <Reveal>
          <p className="text-center text-[12px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">
            Learners hired at and certified with
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-14">
            {partners.map((p) => (
              <span
                key={p.name}
                className="font-display text-lg font-extrabold text-slate-300 transition-all duration-300 hover:text-slate-600 dark:text-slate-700 dark:hover:text-slate-300 sm:text-2xl"
              >
                {p.name}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
