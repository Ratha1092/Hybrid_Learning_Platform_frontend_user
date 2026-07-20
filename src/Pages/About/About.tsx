import { ArrowRight, Globe2, ShieldCheck, Sparkles, Users2, Target, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Reveal } from "../../utils/anim";
import { useSettings } from "../../context/SettingsContext";
import Stats from "../../Components/Stats/Stats";
import FinalCta from "../../Components/FinalCta/FinalCta";

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

const TEAM = [
  {
    name: "Sokha Ratha",
    role: "Founder & CEO",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=75",
  },
  {
    name: "Lina Chan",
    role: "Head of Curriculum",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=75",
  },
  {
    name: "Marcus Reyes",
    role: "Head of Engineering",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=75",
  },
  {
    name: "Priya Nair",
    role: "Head of Community",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=300&q=75",
  },
];

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
      <section className="bg-[#EEF1F6] py-16 dark:bg-slate-950 sm:py-20">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50 px-3.5 py-1.5 text-[13px] font-semibold text-blue-600 dark:border-white/10 dark:bg-white/[0.08] dark:text-blue-200">
                <Target className="h-3.5 w-3.5" /> Why we exist
              </span>
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

      {/* Team */}
      <section className="bg-[#EEF1F6] py-16 dark:bg-slate-950 sm:py-20">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <Reveal className="mx-auto max-w-xl text-center">
            <p className="mb-2 text-sm font-semibold brand-blue">Who's behind it</p>
            <h2 className="font-display text-[30px] font-extrabold ink sm:text-[38px]">Meet the team</h2>
            <p className="mt-3 text-[15px] muted2">
              A small, focused team obsessed with making online learning actually work.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((member, i) => (
              <Reveal key={member.name} delay={i * 90}>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-e1 dark:border-slate-700 dark:bg-slate-800">
                  <img src={member.image} alt={member.name} className="h-56 w-full object-cover" />
                  <div className="p-5 text-center">
                    <h3 className="font-display text-[15px] font-bold ink">{member.name}</h3>
                    <p className="mt-1 text-[13px] muted2">{member.role}</p>
                  </div>
                </div>
              </Reveal>
            ))}
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
