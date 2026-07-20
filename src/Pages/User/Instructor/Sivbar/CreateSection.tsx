import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Layers, PlusCircle, ArrowRight, Lightbulb, Info } from "lucide-react";
import { instructorService, type StandaloneSection } from "../../../../services/instructorService";

export default function SectionLibrary() {
  const navigate = useNavigate();
  const [sections, setSections] = useState<StandaloneSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setLoadError(null);
    instructorService.getStandaloneSections()
      .then(({ data }) => setSections(data.data ?? []))
      .catch(() => setLoadError("Failed to load sections. Please refresh."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setSaving(true); setSaveError(null);
    try {
      const { data } = await instructorService.createStandaloneSection(newTitle.trim());
      setSections((prev) => [data.data, ...prev]);
      setNewTitle(""); setShowForm(false);
    } catch {
      setSaveError("Failed to create section. Please try again.");
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-extrabold text-slate-900 dark:text-white">
            Section Library
          </h1>
          <p className="mt-0.5 text-[14px] text-slate-500 dark:text-slate-400">
            {loading ? "Loading…" : `${sections.length} standalone section${sections.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            <PlusCircle className="h-4 w-4" />
            New Section
          </button>
        )}
      </div>

      {/* ── Two-column body ── */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

        {/* ── Left — main content ── */}
        <div className="min-w-0 flex-1 flex flex-col gap-4">

          {/* Info banner */}
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 dark:border-amber-500/20 dark:bg-amber-500/10">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-[13px] leading-relaxed text-amber-800 dark:text-amber-300">
              Build sections here first. When you create a course, the{" "}
              <span className="font-semibold">Attach Sections</span> step lets you pick any section from this library and add it to your course.
            </p>
          </div>

          {/* Inline create form */}
          {showForm && (
            <div className="rounded-2xl border border-teal-200 bg-white p-5 shadow-e1 dark:border-teal-500/25 dark:bg-slate-800">
              <p className="mb-3 text-[13.5px] font-bold text-slate-800 dark:text-slate-100">New standalone section</p>
              <div className="flex gap-2.5">
                <input
                  autoFocus
                  placeholder="e.g. Getting Started with React"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[13.5px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500"
                />
                <button
                  onClick={handleCreate}
                  disabled={saving || !newTitle.trim()}
                  className="rounded-xl bg-teal-600 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => { setShowForm(false); setNewTitle(""); setSaveError(null); }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
              {saveError && <p className="mt-2 text-[12.5px] font-medium text-rose-600 dark:text-rose-400">⚠ {saveError}</p>}
            </div>
          )}

          {/* Load error */}
          {loadError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
              ⚠ {loadError}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-800">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-teal-600" />
            </div>
          )}

          {/* Empty state */}
          {!loading && !loadError && sections.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white py-16 dark:border-slate-700 dark:bg-slate-800">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 dark:bg-slate-700">
                <BookOpen className="h-7 w-7 text-slate-300 dark:text-slate-500" />
              </div>
              <div className="text-center">
                <p className="text-[15px] font-semibold text-slate-700 dark:text-slate-200">No standalone sections yet</p>
                <p className="mt-1 text-[13px] text-slate-400 dark:text-slate-500">Create your first section above to get started.</p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-2.5 text-[13px] font-semibold text-teal-700 transition-colors hover:bg-teal-100 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20"
              >
                <PlusCircle className="h-4 w-4" />
                Create first section
              </button>
            </div>
          )}

          {/* Section list */}
          {!loading && sections.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {sections.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-e1 transition-all hover:border-slate-300 hover:shadow-soft dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
                >
                  {/* Drag handle */}
                  <div className="flex shrink-0 cursor-grab flex-col gap-1 opacity-30">
                    <div className="flex gap-1">
                      <div className="h-1 w-1 rounded-full bg-slate-500" />
                      <div className="h-1 w-1 rounded-full bg-slate-500" />
                    </div>
                    <div className="flex gap-1">
                      <div className="h-1 w-1 rounded-full bg-slate-500" />
                      <div className="h-1 w-1 rounded-full bg-slate-500" />
                    </div>
                    <div className="flex gap-1">
                      <div className="h-1 w-1 rounded-full bg-slate-500" />
                      <div className="h-1 w-1 rounded-full bg-slate-500" />
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-50 dark:bg-teal-500/10">
                    <Layers className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[14px] font-semibold text-slate-800 dark:text-slate-100">{s.title}</p>
                    <p className="mt-0.5 text-[12px] text-slate-400 dark:text-slate-500">
                      {s.lessons_count === 0 ? "No lessons yet" : `${s.lessons_count} lesson${s.lessons_count !== 1 ? "s" : ""}`}
                      <span className="mx-2 text-slate-200 dark:text-slate-600">·</span>
                      <span className="font-medium text-slate-500 dark:text-slate-400">Standalone</span>
                    </p>
                  </div>
                </div>
              ))}

              {/* Attach CTA */}
              <div className="mt-1 flex items-center justify-between gap-4 rounded-2xl border border-teal-100 bg-teal-50 px-5 py-4 dark:border-teal-500/20 dark:bg-teal-500/10">
                <p className="text-[13.5px] font-medium text-teal-700 dark:text-teal-300">
                  Ready to use these sections in a course?
                </p>
                <button
                  onClick={() => navigate("/instructor/courses/create")}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-teal-700"
                >
                  Create Course
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right — guide panel ── */}
        <div className="flex shrink-0 flex-col gap-4 lg:w-72">

          {/* How to use */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-4 text-[13.5px] font-bold text-slate-800 dark:text-slate-100">How to use sections</h3>
            <ol className="space-y-0">
              {[
                { step: "1", title: "Create sections here", desc: "Give each section a clear title like \"Introduction\" or \"Advanced Topics\"." },
                { step: "2", title: "Create a course", desc: "Go to Create Course. In the Curriculum step, attach sections from this library." },
                { step: "3", title: "Add lessons", desc: "After attaching, add video, article, or quiz lessons inside each section." },
                { step: "4", title: "Submit for review", desc: "Once the course is complete, submit it. An admin will review and publish it." },
              ].map(({ step, title, desc }, i, arr) => (
                <li key={step} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-600 text-[12px] font-bold text-white">
                      {step}
                    </div>
                    {i < arr.length - 1 && (
                      <div className="my-1 w-px flex-1 bg-slate-100 dark:bg-slate-700" style={{ minHeight: 16 }} />
                    )}
                  </div>
                  <div className="pb-4 pt-0.5">
                    <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">{title}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-slate-400 dark:text-slate-500">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Tips */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-e1 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-3 text-[13.5px] font-bold text-slate-800 dark:text-slate-100">Tips</h3>
            <ul className="space-y-3">
              {[
                "Name sections by topic, not by number — they can be reordered later.",
                "One section can be reused across multiple courses.",
                "You can create sections here without any course — they stay in your library.",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2.5">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />
                  <span className="text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick link */}
          <button
            onClick={() => navigate("/instructor/courses/create")}
            className="flex items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-left transition-colors hover:bg-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:hover:bg-blue-500/20"
          >
            <div>
              <p className="text-[13px] font-semibold text-blue-700 dark:text-blue-300">Ready to create a course?</p>
              <p className="mt-0.5 text-[12px] text-blue-500 dark:text-blue-400">Jump straight to the course builder</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-blue-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
