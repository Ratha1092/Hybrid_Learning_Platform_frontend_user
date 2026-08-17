import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, ChevronDown, MessageCircleQuestion, Compass,
  UserPlus, PlayCircle, FileEdit, UploadCloud, Wallet,
} from "lucide-react";
import { Reveal } from "../../utils/anim";

const STUDENT_STEPS = [
  { title: "Create your account",  text: "Sign up free with email, Google, or GitHub — takes less than a minute.", Icon: UserPlus },
  { title: "Find a course",        text: "Browse categories or search for exactly what you want to learn.",        Icon: Search },
  { title: "Enroll & learn",       text: "Watch lessons and track your progress from your dashboard.",              Icon: PlayCircle },
];

const INSTRUCTOR_STEPS = [
  { title: "Apply to teach",       text: "Click \"Become an Instructor\" in the navbar and submit your application.", Icon: FileEdit },
  { title: "Build your course",    text: "Add sections, lessons, and resources, then set your price.",               Icon: UploadCloud },
  { title: "Publish & reach students", text: "Once approved, your course goes live in the catalog.",                 Icon: Compass },
  { title: "Track your earnings",  text: "Monitor enrollments, reviews, and payouts from your dashboard.",           Icon: Wallet },
];

const FAQS = [
  {
    q: "How do I enroll in a course?",
    a: "Browse the Courses page, click on any course you're interested in, and hit the Enroll button. If it's a paid course, you'll be guided through the payment flow.",
  },
  {
    q: "How do I become an instructor?",
    a: "Log in, then click \"Become an Instructor\" in the navbar. Fill out your application and our team will review it within 3–5 business days.",
  },
  {
    q: "Do courses expire after purchase?",
    a: "No — once you purchase a course it's yours for life, including any future updates the instructor adds.",
  },
  {
    q: "Is there a mobile app?",
    a: "We're currently web-first and fully responsive on all screen sizes. A dedicated mobile app is on our roadmap.",
  },
];

type Tab = "guide" | "faq";

export default function Help() {
  const [tab, setTab] = useState<Tab>("faq");
  const [search, setSearch] = useState("");

  const filteredFaqs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return FAQS;
    return FAQS.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [search]);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-900 py-16 text-center sm:py-20">
        <div className="mx-auto max-w-[700px] px-4 sm:px-6">
          <h1 className="font-display text-[32px] font-extrabold text-white sm:text-[42px]">
            How can we help?
          </h1>
          <p className="mt-3 text-[15px] text-white/80">
            Guides to get you started, and answers to the questions we hear most.
          </p>

          <div className="relative mt-8">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); if (e.target.value.trim()) setTab("faq"); }}
              placeholder="Search the FAQ…"
              className="w-full rounded-full border-0 bg-white py-3.5 pl-12 pr-5 text-[15px] text-slate-800 shadow-lg outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-white/30"
            />
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-[64px] z-10 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-[1400px] justify-center gap-2 px-4 sm:px-6">
          <button
            onClick={() => setTab("guide")}
            className={`flex items-center gap-2 border-b-2 px-5 py-4 text-[14.5px] font-semibold transition-colors ${
              tab === "guide" ? "border-blue-600 brand-blue" : "border-transparent muted2 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <Compass className="h-4 w-4" /> Getting Started Guide
          </button>
          <button
            onClick={() => setTab("faq")}
            className={`flex items-center gap-2 border-b-2 px-5 py-4 text-[14.5px] font-semibold transition-colors ${
              tab === "faq" ? "border-blue-600 brand-blue" : "border-transparent muted2 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <MessageCircleQuestion className="h-4 w-4" /> FAQ
          </button>
        </div>
      </div>

      {/* Guide */}
      {tab === "guide" && (
        <section className="bg-[#EEF1F6] py-16 dark:bg-slate-950 sm:py-20">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
            <Reveal className="mb-12">
              <p className="mb-2 text-sm font-semibold brand-blue">For students</p>
              <h2 className="font-display text-[26px] font-extrabold ink sm:text-[30px]">Your first course, step by step</h2>
            </Reveal>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STUDENT_STEPS.map(({ title, text, Icon }, i) => (
                <Reveal key={title} delay={i * 80}>
                  <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
                    <div className="grid h-12 w-12 place-items-center rounded-xl grad-blue text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-display text-[16px] font-bold ink">{i + 1}. {title}</h3>
                    <p className="mt-2 text-[13.5px] leading-relaxed muted2">{text}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal className="mb-12 mt-16">
              <p className="mb-2 text-sm font-semibold brand-blue">For instructors</p>
              <h2 className="font-display text-[26px] font-extrabold ink sm:text-[30px]">From application to your first sale</h2>
            </Reveal>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {INSTRUCTOR_STEPS.map(({ title, text, Icon }, i) => (
                <Reveal key={title} delay={i * 80}>
                  <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
                    <div className="grid h-12 w-12 place-items-center rounded-xl grad-blue text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-display text-[16px] font-bold ink">{i + 1}. {title}</h3>
                    <p className="mt-2 text-[13.5px] leading-relaxed muted2">{text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {tab === "faq" && (
        <section className="bg-[#EEF1F6] py-16 dark:bg-slate-950 sm:py-20">
          <div className="mx-auto max-w-[760px] px-4 sm:px-6">
            {filteredFaqs.length === 0 ? (
              <p className="text-center text-[15px] muted2">
                No results for "{search}". Try a different search, or <Link to="/contact" className="brand-blue font-semibold">contact us</Link> directly.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredFaqs.map((item) => (
                  <details key={item.q} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow open:shadow-e1 dark:border-slate-700 dark:bg-slate-800">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-[15px] font-semibold ink">
                      {item.q}
                      <ChevronDown className="h-4 w-4 shrink-0 muted2 transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="border-t border-slate-100 px-5 pb-4 pt-3.5 text-[13.5px] leading-relaxed muted2 dark:border-slate-700">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-white py-16 text-center dark:bg-slate-900">
        <div className="mx-auto max-w-[500px] px-4 sm:px-6">
          <h2 className="font-display text-[22px] font-extrabold ink">Still need help?</h2>
          <p className="mt-2 text-[14px] muted2">Our support team replies within 24 hours.</p>
          <Link
            to="/contact"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-brand px-7 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Contact support
          </Link>
        </div>
      </section>
    </>
  );
}
