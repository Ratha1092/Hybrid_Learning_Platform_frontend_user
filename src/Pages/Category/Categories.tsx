import { ArrowUpRight, BookOpen, Code2, PenTool, FlaskConical, Camera, DollarSign, Video, Award, TrendingUp, Users, MessageSquare, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { type Category } from "../../services/categoryService";
import { Reveal } from "../../utils/anim";

const ICON_MAP: Record<string, { Icon: React.ElementType; tint: string; ic: string }> = {
  programming: { Icon: Code2,         tint: "from-blue-500/15 to-blue-500/5",     ic: "text-blue-600" },
  code:        { Icon: Code2,         tint: "from-blue-500/15 to-blue-500/5",     ic: "text-blue-600" },
  development: { Icon: Code2,         tint: "from-blue-500/15 to-blue-500/5",     ic: "text-blue-600" },
  design:      { Icon: PenTool,       tint: "from-violet-500/15 to-violet-500/5", ic: "text-violet-600" },
  art:         { Icon: PenTool,       tint: "from-violet-500/15 to-violet-500/5", ic: "text-violet-600" },
  ui:          { Icon: PenTool,       tint: "from-violet-500/15 to-violet-500/5", ic: "text-violet-600" },
  ai:          { Icon: Bot,           tint: "from-cyan-500/15 to-cyan-500/5",     ic: "text-cyan-600" },
  data:        { Icon: Bot,           tint: "from-cyan-500/15 to-cyan-500/5",     ic: "text-cyan-600" },
  science:     { Icon: FlaskConical,  tint: "from-cyan-500/15 to-cyan-500/5",     ic: "text-cyan-600" },
  photography: { Icon: Camera,        tint: "from-fuchsia-500/15 to-fuchsia-500/5", ic: "text-fuchsia-600" },
  business:    { Icon: TrendingUp,    tint: "from-emerald-500/15 to-emerald-500/5", ic: "text-emerald-600" },
  finance:     { Icon: DollarSign,    tint: "from-teal-500/15 to-teal-500/5",     ic: "text-teal-600" },
  marketing:   { Icon: TrendingUp,    tint: "from-rose-500/15 to-rose-500/5",     ic: "text-rose-600" },
  video:       { Icon: Video,         tint: "from-amber-500/15 to-amber-500/5",   ic: "text-amber-600" },
  music:       { Icon: Award,         tint: "from-pink-500/15 to-pink-500/5",     ic: "text-pink-600" },
  personal:    { Icon: Users,         tint: "from-indigo-500/15 to-indigo-500/5", ic: "text-indigo-600" },
  language:    { Icon: MessageSquare, tint: "from-amber-500/15 to-amber-500/5",   ic: "text-amber-600" },
  default:     { Icon: BookOpen,      tint: "from-blue-500/15 to-blue-500/5",     ic: "text-blue-600" },
};

function getCategoryStyle(category: Category) {
  const key = `${category.slug} ${category.name}`.toLowerCase();
  for (const [keyword, style] of Object.entries(ICON_MAP)) {
    if (keyword !== "default" && key.includes(keyword)) return style;
  }
  return ICON_MAP.default;
}

export default function Categories({ categories }: { categories?: Category[] }) {
  const loading = categories === undefined;
  const navigate = useNavigate();

  return (
    <section className="bg-[#EEF1F6] dark:bg-slate-950 py-20 sm:py-28">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <Reveal className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold brand-blue">Browse by category</p>
            <h2 className="font-display text-[32px] font-extrabold ink sm:text-[40px]">
              Explore top categories
            </h2>
            <p className="mt-2 text-[15px] muted2">
              From code to creativity — find the right track for your goals.
            </p>
          </div>
        </Reveal>

        {loading ? (
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {(categories ?? []).slice(0, 12).map((cat, i) => {
              const { Icon, tint, ic } = getCategoryStyle(cat);
              return (
                <Reveal key={cat.id} delay={i * 60}>
                  <button
                    onClick={() => navigate(`/courses?category=${cat.slug}`)}
                    className="group flex min-w-0 w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-e1 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card dark:border-slate-700 dark:bg-slate-800"
                  >
                    {/* Icon / thumbnail panel */}
                    {cat.image_url ? (
                      <div className="h-24 w-full overflow-hidden sm:h-28">
                        <img
                          src={cat.image_url}
                          alt={cat.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <span className={`flex h-24 w-full items-center justify-center bg-gradient-to-br ${tint} transition-transform duration-300 group-hover:scale-105 sm:h-28`}>
                        <Icon className={`h-8 w-8 ${ic}`} strokeWidth={2} />
                      </span>
                    )}

                    {/* Body */}
                    <div className="flex min-w-0 flex-1 flex-col p-4 text-left">
                      <h3 className="line-clamp-2 min-h-[2.25rem] font-display text-[15px] font-bold leading-tight ink">{cat.name}</h3>
                      <p className="mt-1 text-[13px] muted2">{cat.courses_count} courses</p>
                      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-700">
                        <span className="text-[12.5px] font-semibold brand-blue">Explore</span>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-blue-600 dark:text-slate-600" />
                      </div>
                    </div>
                  </button>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
