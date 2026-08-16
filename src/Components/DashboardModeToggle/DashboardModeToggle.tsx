import { GraduationCap, BookOpen } from "lucide-react";
import { useDashboardSwitch } from "../../hooks/useDashboardSwitch";

// Segmented Teaching/Learning switcher — same look everywhere it appears
// (navbar account menu, instructor sidebar, student profile sidebar), so
// switching feels like one consistent control rather than three different
// widgets. Renders nothing for accounts that aren't both an instructor and
// a student.
export default function DashboardModeToggle({ className = "" }: { className?: string }) {
  const { canSwitch, view, switchTo } = useDashboardSwitch();
  if (!canSwitch) return null;

  return (
    <div className={`flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/60 ${className}`}>
      <button
        type="button"
        onClick={() => switchTo("teaching")}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[12.5px] font-semibold transition-colors ${
          view === "teaching"
            ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400"
            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
      >
        <GraduationCap className="h-3.5 w-3.5" /> Teaching
      </button>
      <button
        type="button"
        onClick={() => switchTo("learning")}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[12.5px] font-semibold transition-colors ${
          view === "learning"
            ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400"
            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
      >
        <BookOpen className="h-3.5 w-3.5" /> Learning
      </button>
    </div>
  );
}
