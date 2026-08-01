import { Compass, PlayCircle, ClipboardCheck, Award, Rocket } from "lucide-react";
import { Reveal } from "../../utils/anim";
import { useLanguage } from "../../context/LanguageContext";

export default function LearningPath() {
  const { t } = useLanguage();

  const steps = [
    { title: t("learningPath.step1Title"), text: t("learningPath.step1Text"), Icon: Compass        },
    { title: t("learningPath.step2Title"), text: t("learningPath.step2Text"), Icon: PlayCircle     },
    { title: t("learningPath.step3Title"), text: t("learningPath.step3Text"), Icon: ClipboardCheck },
    { title: t("learningPath.step4Title"), text: t("learningPath.step4Text"), Icon: Award          },
    { title: t("learningPath.step5Title"), text: t("learningPath.step5Text"), Icon: Rocket         },
  ];

  return (
    <section className="bg-white dark:bg-slate-900 py-20 sm:py-28">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="mb-2 text-sm font-semibold brand-blue">{t("learningPath.tag")}</p>
          <h2 className="font-display text-[32px] font-extrabold ink sm:text-[40px]">
            {t("learningPath.title")}
          </h2>
          <p className="mt-3 text-[15px] muted2">
            {t("learningPath.desc")}
          </p>
        </Reveal>

        <div className="relative mt-16">
          {/* Connecting line — desktop */}
          <div className="absolute left-0 right-0 top-7 hidden h-0.5 bg-gradient-to-r from-transparent via-blue-200 to-transparent lg:block dark:via-blue-900/60" />

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
            {steps.map(({ title, text, Icon }, i) => (
              <Reveal key={title} delay={i * 90} className="relative text-center">
                {/* Step icon */}
                <div className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl grad-blue text-white shadow-glow">
                  <Icon className="h-6 w-6" />
                  <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-white text-[11px] font-extrabold brand-blue shadow-e1 dark:border-slate-900 dark:bg-slate-900">
                    {i + 1}
                  </span>
                </div>

                <h3 className="mt-5 font-display text-[16px] font-bold ink">{title}</h3>
                <p className="mx-auto mt-2 max-w-[200px] text-[13.5px] leading-relaxed muted2">{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
