import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, ImagePlus, X, Globe, Lock, Award } from "lucide-react";
import { instructorService, type InstructorCourse } from "../../../../services/instructorService";
import Curriculum from "./Curriculum";

type Tab = "info" | "curriculum";

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  draft:    { label: "Draft",          cls: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400" },
  pending:  { label: "Pending Review", cls: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400" },
  published:{ label: "Published",      cls: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" },
  rejected: { label: "Rejected",       cls: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400" },
};

const FIELD = "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13.5px] text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700/50 dark:text-white dark:placeholder:text-slate-500";
const LABEL = "mb-1.5 block text-[13px] font-semibold text-slate-700 dark:text-slate-300";

export default function EditCourse() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const thumbRef = useRef<HTMLInputElement>(null);

  const [course, setCourse]   = useState<InstructorCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<Tab>("info");

  const [form, setForm] = useState({
    title: "", short_description: "", description: "", price: "0", level: "beginner",
    preview_video_url: "", requirements: "", what_you_will_learn: "",
    certificate_enabled: false, visibility: "public",
  });
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const [thumbFile, setThumbFile]       = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);

  const handleThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    if (!id) return;
    instructorService.getCourseById(id)
      .then(({ data }) => {
        const c = data.data;
        setCourse(c);
        setForm({
          title:               c.title,
          short_description:   c.short_description ?? "",
          description:         c.description ?? "",
          price:               c.price,
          level:               c.level,
          preview_video_url:   c.preview_video_url ?? "",
          requirements:        c.requirements ?? "",
          what_you_will_learn: c.what_you_will_learn ?? "",
          certificate_enabled: c.certificate_enabled ?? false,
          visibility:          c.visibility ?? "public",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const getError = (err: unknown): string => {
    const e = err as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } }; message?: string };
    if ((e.response?.status ?? 0) >= 500) return "Something went wrong. Please try again.";
    const errs = e.response?.data?.errors;
    if (errs) return Object.values(errs).flat().join(" ");
    const msg = e.response?.data?.message ?? e.message ?? "Failed to save.";
    if (["SQLSTATE", "SQL:", "pgsql", "constraint"].some((k) => msg.includes(k))) return "Something went wrong. Please try again.";
    return msg;
  };

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (saving || !id) return;
    setSaving(true); setError(null);
    try {
      const { data } = await instructorService.updateCourse(id, form);
      setCourse(data.data);
      if (thumbFile) await instructorService.uploadThumbnail(id, thumbFile);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { setError(getError(err)); }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
    </div>
  );

  if (!course) return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <p className="text-[15px] text-slate-500">Course not found.</p>
    </div>
  );

  const statusCfg = STATUS_CFG[course.status] ?? STATUS_CFG.draft;
  const currentThumb = thumbPreview ?? course.thumbnail_url;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            onClick={() => navigate("/instructor/courses")}
            className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            My Courses
          </button>
          <h1 className="font-display text-[26px] font-extrabold text-slate-900 dark:text-white">
            {course.title}
          </h1>
        </div>
        <span className={`mt-1 inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[12px] font-bold ${statusCfg.cls}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/50">
        {([
          { key: "info",       emoji: "📝", label: "Basic Info" },
          { key: "curriculum", emoji: "🎬", label: "Curriculum" },
        ] as const).map(({ key, emoji, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-[13.5px] font-semibold transition-all ${
              tab === key
                ? "bg-white shadow-sm text-slate-900 dark:bg-slate-700 dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <span>{emoji}</span>
            {label}
          </button>
        ))}
      </div>

      {/* ── Basic Info tab ── */}
      {tab === "info" && (
        <form onSubmit={handleSave} className="flex flex-col gap-5">

          {saved && (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle className="h-4 w-4" />
              Changes saved successfully!
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
              ⚠ {error}
            </div>
          )}

          {/* Thumbnail + title side-by-side on lg */}
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">

            {/* Thumbnail */}
            <div className="shrink-0">
              <label className={LABEL}>Thumbnail</label>
              <div
                className="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-blue-400 dark:border-slate-600 dark:bg-slate-700/30"
                style={{ width: 220, height: 140 }}
                onClick={() => thumbRef.current?.click()}
              >
                {currentThumb ? (
                  <img src={currentThumb} alt="Thumbnail" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2">
                    <ImagePlus className="h-7 w-7 text-slate-300" />
                    <p className="text-center text-[12px] text-slate-400">Click to upload<br />1280×720 recommended</p>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="text-[12px] font-semibold text-white">Change image</p>
                </div>
              </div>
              <input ref={thumbRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleThumbChange} />
              {thumbFile && (
                <button type="button" onClick={() => { setThumbFile(null); setThumbPreview(null); }}
                  className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-rose-500 hover:text-rose-600">
                  <X className="h-3.5 w-3.5" /> Remove new image
                </button>
              )}
            </div>

            {/* Title + short desc */}
            <div className="flex flex-1 flex-col gap-4">
              <div>
                <label className={LABEL}>Course Title <span className="text-rose-500">*</span></label>
                <input required value={form.title} onChange={(e) => set("title", e.target.value)} className={FIELD} />
              </div>
              <div>
                <label className={LABEL}>
                  Short Description
                  <span className="ml-1.5 font-normal text-slate-400">{form.short_description.length}/160</span>
                </label>
                <input
                  placeholder="1-2 sentences shown on course card"
                  maxLength={160}
                  value={form.short_description}
                  onChange={(e) => set("short_description", e.target.value)}
                  className={FIELD}
                />
              </div>
              {/* Level / Price / Status row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={LABEL}>Level</label>
                  <select value={form.level} onChange={(e) => set("level", e.target.value)} className={FIELD}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Price ($)</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} className={FIELD} />
                </div>
                <div>
                  <label className={LABEL}>Status</label>
                  <input value={course.status} disabled className={`${FIELD} cursor-not-allowed opacity-60`} />
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={LABEL}>
              Description
              <span className="ml-1.5 font-normal text-slate-400">{form.description.length}/3000</span>
            </label>
            <textarea
              rows={5}
              maxLength={3000}
              placeholder="Tell students what they will learn..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={`${FIELD} resize-y`}
            />
          </div>

          {/* Preview video */}
          <div>
            <label className={LABEL}>Preview Video URL</label>
            <input
              placeholder="https://youtube.com/watch?v=..."
              value={form.preview_video_url}
              onChange={(e) => set("preview_video_url", e.target.value)}
              className={FIELD}
            />
          </div>

          {/* What you'll learn + Requirements */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className={LABEL}>What Students Will Learn</label>
              <textarea
                rows={5}
                placeholder="One skill per line"
                value={form.what_you_will_learn}
                onChange={(e) => set("what_you_will_learn", e.target.value)}
                className={`${FIELD} resize-y`}
              />
            </div>
            <div>
              <label className={LABEL}>Requirements</label>
              <textarea
                rows={5}
                placeholder="One prerequisite per line"
                value={form.requirements}
                onChange={(e) => set("requirements", e.target.value)}
                className={`${FIELD} resize-y`}
              />
            </div>
          </div>

          {/* Visibility + Certificate */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL}>Visibility</label>
              <div className="flex gap-2.5">
                {([
                  { value: "public",  Icon: Globe, label: "Public" },
                  { value: "private", Icon: Lock,  label: "Private" },
                ] as const).map(({ value, Icon, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set("visibility", value)}
                    className={`flex flex-1 items-center gap-2.5 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                      form.visibility === value
                        ? "border-blue-500 bg-blue-50/60 dark:border-blue-400 dark:bg-blue-500/10"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700/30"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${form.visibility === value ? "text-blue-500" : "text-slate-400"}`} />
                    <span className={`text-[13px] font-semibold ${form.visibility === value ? "text-blue-700 dark:text-blue-300" : "text-slate-600 dark:text-slate-400"}`}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={LABEL}>Certificate</label>
              <button
                type="button"
                onClick={() => set("certificate_enabled", !form.certificate_enabled)}
                className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${
                  form.certificate_enabled
                    ? "border-blue-500 bg-blue-50/60 dark:border-blue-400 dark:bg-blue-500/10"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700/30"
                }`}
              >
                <Award className={`h-4 w-4 shrink-0 ${form.certificate_enabled ? "text-blue-500" : "text-slate-400"}`} />
                <span className={`flex-1 text-[13px] font-semibold ${form.certificate_enabled ? "text-blue-700 dark:text-blue-300" : "text-slate-600 dark:text-slate-400"}`}>
                  Enable certificate on completion
                </span>
                <div className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${form.certificate_enabled ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-600"}`}>
                  <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${form.certificate_enabled ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
              </button>
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-8 py-3 text-[14px] font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      )}

      {/* ── Curriculum tab ── */}
      {tab === "curriculum" && (
        <Curriculum courseId={course.id} />
      )}
    </div>
  );
}
