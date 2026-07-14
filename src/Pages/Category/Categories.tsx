import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowRight, BookOpen, Code2, PenTool, FlaskConical, Camera, DollarSign, Video, Award, TrendingUp, Users, MessageSquare, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { categoryService, type Category } from "../../services/categoryService";
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

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    categoryService.getAll()
      .then(({ data }) => setCategories(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
          <button
            onClick={() => navigate("/categories")}
            className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold ink shadow-e1 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-blue-400"
          >
            View all categories <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </Reveal>

        {loading ? (
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.slice(0, 12).map((cat, i) => {
              const { Icon, tint, ic } = getCategoryStyle(cat);
              return (
                <Reveal key={cat.id} delay={i * 60}>
                  <button
                    onClick={() => navigate(`/courses?category=${cat.slug}&name=${encodeURIComponent(cat.name)}`)}
                    className="group relative flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-e1 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card sm:p-5 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${tint} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 sm:h-14 sm:w-14`}>
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name} className="h-7 w-7 object-contain" />
                      ) : (
                        <Icon className={`h-6 w-6 ${ic}`} strokeWidth={2} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1 text-left">
                      <h3 className="font-display text-[15px] font-bold leading-tight ink">{cat.name}</h3>
                      <p className="text-[13px] muted2">{cat.courses_count} courses</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition-all duration-300 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-slate-600" />
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
