import { Compass, PlayCircle, ClipboardCheck, Award, Rocket } from "lucide-react";
import { Reveal } from "../../utils/anim";

const steps = [
  { title: "Choose your path",  text: "Pick a curated track aligned to your career goal.",       Icon: Compass       },
  { title: "Enroll & learn",    text: "Access lessons, resources and hands-on projects.",          Icon: PlayCircle    },
  { title: "Practice & quiz",   text: "Reinforce skills with real exercises and quizzes.",          Icon: ClipboardCheck },
  { title: "Earn certificate",  text: "Get a verifiable certificate on completion.",                Icon: Award         },
  { title: "Grow your career",  text: "Showcase skills and unlock new opportunities.",              Icon: Rocket        },
];

export default function LearningPath() {
  return (
    <section className="bg-white dark:bg-slate-900 py-20 sm:py-28">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="mb-2 text-sm font-semibold brand-blue">How it works</p>
          <h2 className="font-display text-[32px] font-extrabold ink sm:text-[40px]">
            Your path from beginner to hired
          </h2>
          <p className="mt-3 text-[15px] muted2">
            A clear, guided journey — every step designed to move your career forward.
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
