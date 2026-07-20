import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Trash2, Plus } from "lucide-react";
import { instructorService, type InstructorSection, type LessonResource } from "../../../../services/instructorService";

interface Props { courseId: number; }

const EXT_ICON: Record<string, string> = {
  pdf: "📄", zip: "🗜️", doc: "📝", docx: "📝", ppt: "📊", pptx: "📊", mp4: "🎬", jpg: "🖼️", png: "🖼️",
};

// ── Lesson Resources Panel ────────────────────────────────────────────────────
function ResourcesPanel({ courseId, sectionId, lessonId }: { courseId: number; sectionId: number; lessonId: number }) {
  const [resources, setResources] = useState<LessonResource[]>([]);
  const [loading, setLoading]     = useState(true);
  const [title, setTitle]         = useState("");
  const [file, setFile]           = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState<number | null>(null);
  const [err, setErr]             = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    instructorService.getLessonResources(courseId, sectionId, lessonId)
      .then((r) => setResources(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId, sectionId, lessonId]);

  const handleUpload = async () => {
    if (!title.trim()) { setErr("Title is required."); return; }
    if (!file)         { setErr("Please select a file."); return; }
    setErr(null); setUploading(true); setProgress(0);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("file", file);
      const res = await instructorService.uploadLessonResource(courseId, sectionId, lessonId, fd, setProgress);
      setResources((prev) => [...prev, res.data.data]);
      setTitle(""); setFile(null); setProgress(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setErr(err.response?.data?.message ?? err.message ?? "Upload failed.");
    }
    setUploading(false); setProgress(null);
  };

  const handleDelete = async (rid: number) => {
    try {
      await instructorService.deleteLessonResource(courseId, sectionId, lessonId, rid);
      setResources((prev) => prev.filter((r) => r.id !== rid));
    } catch { /* silent */ }
  };

  return (
    <div className="mx-6 mb-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-700/30">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Lesson Resources</p>

      {loading ? (
        <p className="text-[12px] text-slate-400">Loading…</p>
      ) : (
        <>
          {resources.length === 0 && <p className="mb-3 text-[12px] text-slate-400">No resources yet.</p>}
          {resources.map((r) => (
            <div key={r.id} className="mb-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800">
              <span className="text-sm">{EXT_ICON[r.type] ?? "📎"}</span>
              <span className="flex-1 text-[12.5px] font-medium text-slate-700 dark:text-slate-200">{r.title}</span>
              <span className="text-[11px] text-slate-400">.{r.type}</span>
              <button onClick={() => handleDelete(r.id)} className="text-slate-300 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          <div className="mt-3 flex flex-col gap-2">
            <input
              placeholder="Resource title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12.5px] outline-none focus:border-blue-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
            <label className="cursor-pointer rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-[12px] text-slate-500 hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-blue-500/5">
              {file ? file.name : "Choose file (PDF, DOC, PPT, ZIP…)"}
              <input ref={fileRef} type="file" accept=".pdf,.zip,.doc,.docx,.ppt,.pptx,.mp4,.jpg,.png" className="hidden"
                onChange={(e) => { setFile(e.target.files?.[0] ?? null); setErr(null); }} />
            </label>
            {err && <p className="text-[11.5px] text-rose-500">⚠ {err}</p>}
            {progress !== null && (
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="self-start rounded-lg bg-blue-600 px-4 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Curriculum ────────────────────────────────────────────────────────────────
export default function Curriculum({ courseId }: Props) {
  const [sections, setSections]           = useState<InstructorSection[]>([]);
  const [loading, setLoading]             = useState(true);
  const [openSections, setOpenSections]   = useState<Set<number>>(new Set([0]));
  const [expandedResources, setExpandedResources] = useState<Set<number>>(new Set());
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [addingSection, setAddingSection] = useState(false);
  const [addingLesson, setAddingLesson]   = useState<number | null>(null);
  const [confirmSection, setConfirmSection] = useState<number | null>(null);
  const [newLesson, setNewLesson]         = useState<Record<number, { title: string; type: string; video_url: string; is_preview: boolean; videoFile?: File | null }>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [error, setError]                 = useState<string | null>(null);

  useEffect(() => {
    instructorService.getSections(courseId)
      .then(({ data }) => {
        const loaded = (data.data ?? []).map((s) => ({ ...s, lessons: s.lessons ?? [] }));
        setSections(loaded);
        setOpenSections(new Set([0]));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId]);

  const toggleSection = (i: number) =>
    setOpenSections((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });

  const toggleResources = (lId: number) =>
    setExpandedResources((prev) => { const n = new Set(prev); n.has(lId) ? n.delete(lId) : n.add(lId); return n; });

  const handleAddSection = async () => {
    if (!newSectionTitle.trim()) return;
    setAddingSection(true); setError(null);
    try {
      const { data } = await instructorService.createSection(courseId, newSectionTitle.trim());
      setSections((prev) => [...prev, { ...data.data, lessons: data.data.lessons ?? [] }]);
      setNewSectionTitle("");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string };
      setError(err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(" ") : err.response?.data?.message ?? "Failed to create section.");
    }
    setAddingSection(false);
  };

  const handleDeleteSection = async (sectionId: number) => {
    setConfirmSection(null); setError(null);
    try {
      await instructorService.deleteSection(courseId, sectionId);
      setSections((prev) => prev.filter((s) => s.id !== sectionId));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(err.response?.data?.message ?? "Failed to delete section.");
    }
  };

  const handleAddLesson = async (sectionId: number) => {
    const lesson = newLesson[sectionId];
    if (!lesson?.title?.trim()) return;
    setError(null);
    try {
      const payload: { title: string; type: string; is_preview: boolean; video_url?: string } = {
        title: lesson.title.trim(), type: lesson.type || "video", is_preview: lesson.is_preview ?? false,
      };
      if (lesson.type === "video" && !lesson.videoFile && lesson.video_url?.trim())
        payload.video_url = lesson.video_url.trim();

      const { data } = await instructorService.createLesson(courseId, sectionId, payload);
      const lessonId = data.data.id;

      if (lesson.type === "video" && lesson.videoFile) {
        setUploadProgress((p) => ({ ...p, [sectionId]: 0 }));
        await instructorService.uploadVideo(courseId, sectionId, lessonId, lesson.videoFile,
          (pct) => setUploadProgress((p) => ({ ...p, [sectionId]: pct })));
        setUploadProgress((p) => { const n = { ...p }; delete n[sectionId]; return n; });
      }

      setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, lessons: [...(s.lessons ?? []), data.data] } : s));
      setNewLesson((prev) => ({ ...prev, [sectionId]: { title: "", type: "video", video_url: "", is_preview: false, videoFile: null } }));
      setAddingLesson(null);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string };
      setError(err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(" ") : err.response?.data?.message ?? "Failed to add lesson.");
    }
  };

  const handleDeleteLesson = async (sectionId: number, lessonId: number) => {
    setError(null);
    try {
      await instructorService.deleteLesson(courseId, sectionId, lessonId);
      setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, lessons: (s.lessons ?? []).filter((l) => l.id !== lessonId) } : s));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(err.response?.data?.message ?? "Failed to delete lesson.");
    }
  };

  if (loading) return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
    </div>
  );

  const totalLessons = sections.reduce((s, sec) => s + sec.lessons.length, 0);

  return (
    <div className="flex flex-col gap-4">

      {/* Summary */}
      <p className="text-[13.5px] text-slate-500 dark:text-slate-400">
        {sections.length} section{sections.length !== 1 ? "s" : ""} · {totalLessons} lesson{totalLessons !== 1 ? "s" : ""}
      </p>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
          ⚠ {error}
        </div>
      )}

      {/* Sections */}
      <div className="flex flex-col gap-3">
        {sections.map((section, si) => (
          <div key={section.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-e1 dark:border-slate-700 dark:bg-slate-800">

            {/* Section header */}
            <div className="flex items-center gap-3 px-5 py-4">
              <button onClick={() => toggleSection(si)} className="flex flex-1 items-center gap-3 text-left">
                <span className="text-slate-400 dark:text-slate-500">
                  {openSections.has(si) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </span>
                <span className="text-[14px] font-bold text-slate-800 dark:text-slate-100">{section.title}</span>
                <span className="text-[12px] text-slate-400 dark:text-slate-500">{section.lessons.length} lesson{section.lessons.length !== 1 ? "s" : ""}</span>
              </button>
              <button
                onClick={() => setConfirmSection(section.id)}
                className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:text-slate-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Lessons */}
            {openSections.has(si) && (
              <div className="border-t border-slate-100 dark:border-slate-700">
                {section.lessons.length === 0 && (
                  <p className="px-6 py-4 text-[13px] text-slate-400 dark:text-slate-500">No lessons yet.</p>
                )}

                {section.lessons.map((lesson) => (
                  <div key={lesson.id} className="border-b border-slate-100 last:border-0 dark:border-slate-700">
                    <div className="flex items-center gap-3 px-6 py-3">
                      <span className="text-[15px]">{lesson.type === "video" ? "🎬" : lesson.type === "quiz" ? "📝" : "📄"}</span>
                      <span className="flex-1 text-[13.5px] font-medium text-slate-700 dark:text-slate-200">{lesson.title}</span>
                      {lesson.is_preview && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                          Preview
                        </span>
                      )}
                      <span className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">{lesson.type}</span>
                      <button
                        onClick={() => toggleResources(lesson.id)}
                        className={`rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition-colors ${
                          expandedResources.has(lesson.id)
                            ? "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600"
                        }`}
                      >
                        📎 Resources
                      </button>
                      <button
                        onClick={() => handleDeleteLesson(section.id, lesson.id)}
                        className="rounded-lg p-1 text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {expandedResources.has(lesson.id) && (
                      <ResourcesPanel courseId={courseId} sectionId={section.id} lessonId={lesson.id} />
                    )}
                  </div>
                ))}

                {/* Add lesson form */}
                {addingLesson === section.id ? (
                  <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-700">
                    <input
                      autoFocus
                      placeholder="Lesson title *"
                      value={newLesson[section.id]?.title ?? ""}
                      onChange={(e) => setNewLesson((p) => ({ ...p, [section.id]: { ...p[section.id], title: e.target.value } }))}
                      onKeyDown={(e) => e.key === "Enter" && handleAddLesson(section.id)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13.5px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                    <div className="flex items-center gap-3">
                      <select
                        value={newLesson[section.id]?.type ?? "video"}
                        onChange={(e) => setNewLesson((p) => ({ ...p, [section.id]: { ...p[section.id], type: e.target.value } }))}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                      >
                        <option value="video">🎬 Video</option>
                        <option value="article">📄 Article</option>
                        <option value="quiz">📝 Quiz</option>
                      </select>
                      <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-600 dark:text-slate-400">
                        <input
                          type="checkbox"
                          checked={newLesson[section.id]?.is_preview ?? false}
                          onChange={(e) => setNewLesson((p) => ({ ...p, [section.id]: { ...p[section.id], is_preview: e.target.checked } }))}
                        />
                        Free Preview
                      </label>
                    </div>

                    {newLesson[section.id]?.type === "video" && (
                      <div className="flex flex-col gap-2">
                        <label className="text-[12px] text-slate-400">Upload video (mp4, mov, webm — max 500MB)</label>
                        <input type="file" accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
                          className="text-[12.5px] text-slate-600 dark:text-slate-400"
                          onChange={(e) => setNewLesson((p) => ({ ...p, [section.id]: { ...p[section.id], videoFile: e.target.files?.[0] ?? null } }))} />
                        {!newLesson[section.id]?.videoFile && (
                          <input
                            placeholder="Or paste YouTube / Vimeo URL"
                            value={newLesson[section.id]?.video_url ?? ""}
                            onChange={(e) => setNewLesson((p) => ({ ...p, [section.id]: { ...p[section.id], video_url: e.target.value } }))}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13.5px] outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                          />
                        )}
                        {uploadProgress[section.id] !== undefined && (
                          <div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                              <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${uploadProgress[section.id]}%` }} />
                            </div>
                            <span className="text-[11px] text-slate-400">Uploading {uploadProgress[section.id]}%</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2.5">
                      <button
                        onClick={() => handleAddLesson(section.id)}
                        className="rounded-xl bg-blue-600 px-5 py-2 text-[13px] font-semibold text-white hover:bg-blue-700"
                      >
                        Save Lesson
                      </button>
                      <button
                        onClick={() => setAddingLesson(null)}
                        className="rounded-xl border border-slate-200 px-5 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-slate-100 px-6 py-3 dark:border-slate-700">
                    <button
                      onClick={() => {
                        setAddingLesson(section.id);
                        setNewLesson((p) => ({ ...p, [section.id]: { title: "", type: "video", video_url: "", is_preview: false } }));
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-500 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-slate-600 dark:text-slate-400 dark:hover:border-blue-400 dark:hover:text-blue-400"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Lesson
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add section */}
      <div className="flex gap-2.5">
        <input
          placeholder="New section title…"
          value={newSectionTitle}
          onChange={(e) => setNewSectionTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13.5px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
        <button
          onClick={handleAddSection}
          disabled={addingSection || !newSectionTitle.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {addingSection ? "Adding…" : "Add Section"}
        </button>
      </div>

      {/* Delete section confirm modal */}
      {confirmSection !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]" onClick={() => setConfirmSection(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-card dark:bg-slate-800" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 text-center text-[2rem]">🗑️</div>
            <h3 className="mb-2 text-center text-[15px] font-bold text-slate-800 dark:text-slate-100">Delete this section?</h3>
            <p className="mb-6 text-center text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
              This will permanently remove the section and all its lessons. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmSection(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700">
                Cancel
              </button>
              <button onClick={() => handleDeleteSection(confirmSection)}
                className="flex-1 rounded-xl bg-rose-500 py-2.5 text-[13px] font-bold text-white hover:bg-rose-600">
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
