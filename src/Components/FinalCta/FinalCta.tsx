import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAuthModal } from "../../context/AuthModalContext";
import { Reveal } from "../../utils/anim";
import { usePlatformStats } from "../../utils/usePlatformStats";

export default function FinalCta() {
  const { isAuthenticated } = useAuth();
  const { openRegister } = useAuthModal();
  const navigate = useNavigate();
  const stats = usePlatformStats();
  const students = stats?.total_students ?? 0;

  return (
    <section className="mx-auto max-w-[1400px] px-4 pb-20 sm:px-6 md:pb-28">
      <Reveal>
        <div className="grad-blue relative overflow-hidden rounded-[32px] px-6 py-14 text-center shadow-glow sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute inset-0 opacity-30">
            <div className="absolute -left-10 -top-10 h-56 w-56 rounded-full bg-white/30 blur-3xl" />
            <div className="absolute -bottom-10 right-0 h-64 w-64 rounded-full bg-cyan-300/40 blur-3xl" />
          </div>
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-[13px] font-semibold text-white">
              <Sparkles className="h-3.5 w-3.5" /> Start your journey today
            </span>
            <h2 className="mx-auto mt-5 max-w-2xl font-display text-[32px] font-extrabold leading-tight text-white sm:text-[46px]">
              Ready to master skills that get you hired?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] text-blue-50">
              {students > 0
                ? `Join ${students.toLocaleString()}+ learners building real, career-changing skills — with`
                : "Build real, career-changing skills — with"}{" "}
              limited time access and a 15-day money-back guarantee.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {isAuthenticated ? (
                <button
                  onClick={() => navigate("/courses")}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold brand-blue transition-transform hover:-translate-y-0.5"
                >
                  Browse Courses <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={openRegister}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold brand-blue transition-transform hover:-translate-y-0.5"
                >
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => navigate("/courses")}
                className="rounded-xl border border-white/40 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Browse Courses
              </button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
