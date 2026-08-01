import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Reveal } from "../../utils/anim";
import { useLanguage } from "../../context/LanguageContext";

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const { t } = useLanguage();

  const faqs = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
    { q: t("faq.q5"), a: t("faq.a5") },
  ];

  return (
    <section className="mx-auto max-w-[820px] px-4 py-20 sm:px-6 md:py-28">
      <Reveal className="text-center">
        <p className="mb-2 text-sm font-semibold brand-blue">{t("faq.tag")}</p>
        <h2 className="font-display text-[32px] font-extrabold ink sm:text-[40px]">
          {t("faq.title")}
        </h2>
      </Reveal>

      <Reveal delay={80} className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-800">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q} className={i < faqs.length - 1 ? "border-b border-slate-100 dark:border-slate-700" : ""}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
              >
                <span className={`font-display text-[15.5px] font-bold transition-colors ${isOpen ? "brand-blue" : "ink"}`}>
                  {f.q}
                </span>
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full transition-colors ${isOpen ? "bg-brand text-white" : "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-400"}`}>
                  {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                </span>
              </button>
              <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden">
                  <p className="px-6 pb-5 text-[14.5px] leading-relaxed muted2">{f.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </Reveal>
    </section>
  );
}
