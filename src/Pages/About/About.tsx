import { ArrowRight, Globe2, ShieldCheck, Sparkles, Users2, Star, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { Reveal } from "../../utils/anim";
import { useSettings } from "../../context/SettingsContext";
import Stats from "../../Components/Stats/Stats";

const assetImages = import.meta.glob("../../assets/*.{jpg,jpeg,png,webp}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

function assetImg(filename: string): string {
  const match = Object.entries(assetImages).find(([path]) => path.endsWith(`/${filename}`));
  return match?.[1] ?? "";
}

const VALUES = [
  {
    icon: Globe2,
    title: "Accessible to everyone",
    text: "Quality education shouldn't depend on where you live or how much you can pay. We keep pricing fair and content available worldwide.",
  },
  {
    icon: ShieldCheck,
    title: "Quality over quantity",
    text: "Every course is reviewed for real-world relevance before it goes live — no filler content, just skills that matter.",
  },
  {
    icon: Users2,
    title: "Community driven",
    text: "Students and instructors shape the platform together through feedback, discussions, and shared success stories.",
  },
  {
    icon: Sparkles,
    title: "Always improving",
    text: "We ship new features and refine the learning experience continuously, guided by what actually helps people learn.",
  },
];

const ADVISOR = {
  name: "Prum Chansamedy",
  role: "Education Advisor & Mentor",
  image: assetImg(""),
  about: "Brings years of experience in education and mentorship, helping shape the platform's direction — from curriculum quality to the overall student experience.",
  years: 8,
  linkedin: "",
  email: "",
};

const TEAM = [
  {
    name: "Torn Ratha",
    role: "Developer",
    image: assetImg("Torn Ratha.jpg"),
  },
  {
    name: "Mao Sakseth",
    role: "Developer",
    image: assetImg("Mao Sakseth.jpg"),
  },
  {
    name: "Ros Vutha",
    role: "Developer",
    image: assetImg ("Ros Vutha.jpg"),
  },
  {
    name: "Chon Davith",
    role: "Developer",
    image: assetImg("Chon Davith.jpg"),
  },
];

function PersonCard({ name, role, image, delay = 0 }: { name: string; role: string; image: string; delay?: number }) {
  return (
    <Reveal delay={delay}>
      <div className="group h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-e1 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card dark:border-slate-700 dark:bg-slate-800">
        <div className="relative aspect-[4/5] w-full overflow-hidden">
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover object-[center_25%] transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-600/50 via-blue-600/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
        <div className="p-5 text-center">
          <h3 className="font-display text-[16px] font-bold ink transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {name}
          </h3>
          <p className="mt-1 text-[13px] muted2">{role}</p>
          <span className="mx-auto mt-3 block h-0.5 w-8 scale-x-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-transform duration-300 group-hover:scale-x-100" />
        </div>
      </div>
    </Reveal>
  );
}

export default function About() {
  const { settings } = useSettings();
  const siteName = settings.site_name || "Hybrid Learning";

  return (
    <>
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 py-14 sm:py-20">
        <div className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-white/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-[400px] w-[400px] rounded-full bg-cyan-200/20 blur-[80px]" />
        <div className="relative mx-auto max-w-[1400px] px-4 text-center sm:px-6">
          <Reveal>
            <p className="mb-2 text-sm font-semibold text-blue-100">Our story</p>
            <h1 className="font-display text-[32px] font-extrabold text-white sm:text-[48px]">
              About {siteName}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-blue-100">
              {settings.site_description ||
                "A modern learning marketplace helping students and instructors grow — without limits."}
            </p>
          </Reveal>
        </div>
      </div>

      {/* Mission */}
      <section className="bg-[#EEF1F6] py-16 dark:bg-slate-950 lg:py-20">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <h2 className="mt-5 font-display text-[30px] font-extrabold leading-tight ink sm:text-[38px]">
                Learning that actually changes what you can do
              </h2>
              <p className="mt-4 max-w-lg text-[15px] leading-relaxed muted2">
                {siteName} started with a simple frustration: too many online courses were long on
                theory and short on outcomes. We set out to build a platform where every course is
                built around real, job-ready skills — taught by instructors who've actually done the
                work — and where progress is easy to track from day one to certificate.
              </p>
              <p className="mt-4 max-w-lg text-[15px] leading-relaxed muted2">
                Today we connect students with expert instructors across design, programming, data,
                and business, all on one platform built for focus, not distraction.
              </p>
              <Link
                to="/courses"
                className="mt-7 inline-flex items-center gap-2 rounded-xl grad-blue px-6 py-3.5 text-sm font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5"
              >
                Explore Courses <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>

            <Reveal delay={140} className="relative hidden lg:block">
              <div className="relative mx-auto max-w-sm">
                <div className="absolute inset-4 rounded-[40px] bg-blue-500/[0.08] blur-2xl dark:bg-blue-600/25" />
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=700&q=75"
                  alt="Team collaborating"
                  className="relative z-10 h-80 w-full rounded-[32px] object-cover shadow-card"
                />
                
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <Reveal className="mx-auto max-w-xl text-center">
            <p className="mb-2 text-sm font-semibold brand-blue">What we stand for</p>
            <h2 className="font-display text-[30px] font-extrabold ink sm:text-[38px]">Our core values</h2>
          </Reveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 90}>
                <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-e1 transition-transform hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-800">
                  <span className="grid h-11 w-11 place-items-center rounded-xl grad-blue text-white shadow-glow">
                    <v.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-[16px] font-bold ink">{v.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed muted2">{v.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Live platform stats */}
      <Stats />

      {/* Advisor & Team */}
      <section className="bg-[#EEF1F6] py-16 dark:bg-slate-950 sm:py-20">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <Reveal className="mx-auto max-w-xl text-center">
            <p className="mb-2 text-sm font-semibold brand-blue">Guiding the mission</p>
            <h2 className="font-display text-[30px] font-extrabold ink sm:text-[38px]">Our advisor</h2>
          </Reveal>

          <Reveal className="mx-auto mt-10 max-w-md">
            <div className="flip-navy grad-navy group overflow-hidden rounded-[28px] shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card dark:shadow-soft-dark">
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                <img
                  src={ADVISOR.image}
                  alt={ADVISOR.name}
                  className="h-full w-full object-cover object-[center_25%] transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />

                <span className="glass-dark absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-wide text-blue-100">
                  <Star className="h-3 w-3 fill-blue-300 text-blue-300" /> Advisor
                </span>
              </div>

              <div className="p-7">
                <h3 className="font-display text-[22px] font-extrabold ink">{ADVISOR.name}</h3>
                <p className="mt-1 text-[14.5px] font-semibold brand-blue">{ADVISOR.role}</p>
                <span className="mt-4 block h-0.5 w-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" />
                {ADVISOR.about && (
                  <p className="mt-4 text-[14.5px] leading-relaxed muted2">{ADVISOR.about}</p>
                )}

                <div className="mt-6 flex items-center justify-between border-t border-slate-200/70 pt-5 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    {ADVISOR.linkedin && (
                      <a
                        href={ADVISOR.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${ADVISOR.name} on LinkedIn`}
                        className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:text-blue-600 dark:bg-white/10 dark:text-slate-300 dark:hover:text-blue-400"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                          <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.6h.1c.5-1 1.8-2 3.7-2 4 0 4.7 2.6 4.7 6V21h-4v-5.3c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8V21h-4V9Z" />
                        </svg>
                      </a>
                    )}
                    {ADVISOR.email && (
                      <a
                        href={`mailto:${ADVISOR.email}`}
                        aria-label={`Email ${ADVISOR.name}`}
                        className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:text-blue-600 dark:bg-white/10 dark:text-slate-300 dark:hover:text-blue-400"
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  {ADVISOR.years > 0 && (
                    <div className="text-right">
                      <p className="font-display text-xl font-extrabold ink">{ADVISOR.years}+</p>
                      <p className="text-[10.5px] font-bold uppercase tracking-wide muted2">Years</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Reveal>

          <div className="mt-20 border-t border-slate-200 pt-16 dark:border-slate-800">
            <Reveal className="mx-auto max-w-xl text-center">
              <p className="mb-2 text-sm font-semibold brand-blue">Who's behind it</p>
              <h2 className="font-display text-[30px] font-extrabold ink sm:text-[38px]">Meet the team</h2>
              <p className="mt-3 text-[15px] muted2">
                A small, focused team obsessed with making online learning actually work.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {TEAM.map((member, i) => (
                <PersonCard key={member.name} name={member.name} role={member.role} image={member.image} delay={i * 90} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      {/* <div className="pt-16 sm:pt-20">
        <FinalCta />
      </div> */}
    </>
  );
}
