import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, Gift, Banknote, Video, FileText, ListChecks, Paperclip, Pencil, Trash2 } from "lucide-react";
import { instructorService, type StandaloneSection, type LessonResource } from "../../../../services/instructorService";
import { categoryService, type Category } from "../../../../services/categoryService";
import { getVideoDuration } from "../../../../utils/videoUrl";
import "../css/CreateCourse.css";

interface LocalLesson {
  id: number; title: string; type: string; is_preview: boolean; video_url?: string; content?: string;
}
interface LocalSection {
  id: number; title: string; order?: number; lessons: LocalLesson[];
}
interface LessonForm {
  title: string; type: string; video_url: string; content: string; is_preview: boolean; videoFile: File | null;
  duration: number | null; articleFile: File | null;
}

const STEPS = ["Basic Info", "Curriculum", "Pricing", "Submit"];

// Draft persistence (sessionStorage)
const DRAFT_KEY = "cc_draft_v1";

interface Draft {
  step: number;
  courseId: number | null;
  info: {
    title: string; category_id: string; level: string; language: string;
    short_description: string; description: string;
    requirements: string; what_you_will_learn: string;
  };
  visibility: string;
  isFree: boolean;
  price: string;
}

function loadDraft(): Draft | null {
  try { const r = sessionStorage.getItem(DRAFT_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
function saveDraft(d: Draft) {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch {}
}
function clearDraft() {
  try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
}

function isTechnicalError(msg: string): boolean {
  return ["SQLSTATE", "SQL:", "pgsql", "transaction", "constraint", "duplicate key"].some((k) => msg.includes(k));
}

function getApiError(err: unknown): string {
  const e = err as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } }; message?: string };
  const status = e.response?.status;
  if (status && status >= 500) return "Something went wrong. Please try again.";
  const errs = e.response?.data?.errors;
  if (errs) return Object.values(errs).flat().join(" ");
  const msg = e.response?.data?.message ?? e.message ?? "Something went wrong.";
  if (isTechnicalError(msg)) return "Something went wrong. Please try again.";
  return msg;
}

// LessonResourcesPane
const EXT_ICON: Record<string, string> = {
  pdf: "📄", zip: "🗜️", doc: "📝", docx: "📝", ppt: "📊", pptx: "📊",
  mp4: "🎬", jpg: "🖼️", png: "🖼️",
};

function LessonResourcesPanel({ courseId, sectionId, lessonId }: { courseId: number; sectionId: number; lessonId: number }) {
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
    if (!file) { setErr("Please select a file."); return; }
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
    <div className="cur-resources">
      <p className="cur-resources__label">Lesson Resources</p>

      {loading ? (
        <p className="cur-resources__hint">Loading…</p>
      ) : (
        <>
          {resources.length === 0 && <p className="cur-resources__hint">No resources yet.</p>}
          {resources.map((r) => (
            <div key={r.id} className="cur-resource-item">
              <span className="cur-resource-item__icon">{EXT_ICON[r.type] ?? "📎"}</span>
              <span className="cur-resource-item__title">{r.title}</span>
              <span className="cur-resource-item__ext">.{r.type}</span>
              <button className="cur-btn cur-btn--icon" onClick={() => handleDelete(r.id)}>✕</button>
            </div>
          ))}

          <div className="cur-resource-form">
            <input
              placeholder="Resource title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="cur-resource-form__input"
            />
            <label className="cur-resource-form__file-label">
              {file ? file.name : "Choose file (PDF, DOC, PPT, ZIP…)"}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.zip,.doc,.docx,.ppt,.pptx,.mp4,.jpg,.png"
                style={{ display: "none" }}
                onChange={(e) => { setFile(e.target.files?.[0] ?? null); setErr(null); }}
              />
            </label>
            {err && <p style={{ color: "#dc2626", fontSize: 12 }}>⚠ {err}</p>}
            {progress !== null && (
              <div className="cur-upload-bar">
                <div className="cur-upload-bar__fill" style={{ width: `${progress}%` }} />
                <span className="cur-upload-bar__label">{progress}%</span>
              </div>
            )}
            <button className="cur-btn cur-btn--primary" onClick={handleUpload} disabled={uploading}>
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// SectionBloc
interface SectionBlockProps {
  section: LocalSection;
  index: number;
  courseId: number;
  autoOpenForm?: boolean;
  onDelete: () => void;
  onLessonAdded: (lesson: LocalLesson) => void;
  onLessonDeleted: (id: number) => void;
  onLessonUpdated: (id: number, fields: Partial<LocalLesson>) => void;
}

function SectionBlock({ section, index, courseId, autoOpenForm, onDelete, onLessonAdded, onLessonDeleted, onLessonUpdated }: SectionBlockProps) {
  const [open, setOpen] = useState(true);
  const [showForm, setShowForm] = useState(!!autoOpenForm);
  const [lesson, setLesson] = useState<LessonForm>({ title: "", type: "video", video_url: "", content: "", is_preview: false, videoFile: null, duration: null, articleFile: null });
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [expandedResources, setExpandedResources] = useState<Set<number>>(new Set());

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: "", is_preview: false, video_url: "", content: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr] = useState<string | null>(null);

  const toggleResources = (lessonId: number) =>
    setExpandedResources((prev) => { const s = new Set(prev); s.has(lessonId) ? s.delete(lessonId) : s.add(lessonId); return s; });

  const startEdit = (l: LocalLesson) => {
    setShowForm(false);
    setEditingId(l.id);
    setEditErr(null);
    setEditForm({ title: l.title, is_preview: l.is_preview, video_url: l.video_url ?? "", content: l.content ?? "" });
  };

  const handleSaveEdit = async (l: LocalLesson) => {
    if (!editForm.title.trim()) { setEditErr("Title is required."); return; }
    setEditSaving(true); setEditErr(null);
    try {
      const payload: Partial<LocalLesson> & { video_url?: string; content?: string } = {
        title: editForm.title.trim(),
        is_preview: editForm.is_preview,
      };
      if (l.type === "video") payload.video_url = editForm.video_url || undefined;
      if (l.type === "article") payload.content = editForm.content || undefined;
      await instructorService.updateLesson(courseId, section.id, l.id, payload);
      onLessonUpdated(l.id, {
        title: editForm.title.trim(),
        is_preview: editForm.is_preview,
        ...(l.type === "video" ? { video_url: editForm.video_url } : {}),
        ...(l.type === "article" ? { content: editForm.content } : {}),
      });
      setEditingId(null);
    } catch (e) { setEditErr(getApiError(e)); }
    setEditSaving(false);
  };

  const setL = (k: keyof LessonForm, v: string | boolean | File | number | null) => setLesson((f) => ({ ...f, [k]: v }));

  const handleAddLesson = async () => {
    if (!lesson.title.trim()) return;
    setSaving(true); setErr(null);
    try {
      const { data } = await instructorService.createLesson(courseId, section.id, {
        title: lesson.title.trim(),
        type: lesson.type,
        duration: lesson.videoFile && lesson.duration != null ? lesson.duration : undefined,
        is_preview: lesson.is_preview,
        video_url: lesson.type === "video" && !lesson.videoFile ? (lesson.video_url || undefined) : undefined,
        content: lesson.content || undefined,
      });
      const lessonId = data.data.id;
      if (lesson.type === "video" && lesson.videoFile) {
        setUploadProgress(0);
        await instructorService.uploadVideo(courseId, section.id, lessonId, lesson.videoFile, setUploadProgress);
        setUploadProgress(null);
      }
      if (lesson.type === "article" && lesson.articleFile) {
        setUploadProgress(0);
        const fd = new FormData();
        fd.append("title", lesson.articleFile.name);
        fd.append("file", lesson.articleFile);
        await instructorService.uploadLessonResource(courseId, section.id, lessonId, fd, setUploadProgress);
        setUploadProgress(null);
      }
      onLessonAdded({ ...data.data, lessons: undefined } as unknown as LocalLesson);
      setLesson({ title: "", type: "video", video_url: "", content: "", is_preview: false, videoFile: null, duration: null, articleFile: null });
      setShowForm(false);
    } catch (e) { setErr(getApiError(e)); }
    setSaving(false);
  };

  const handleDeleteLesson = async (lId: number) => {
    try {
      await instructorService.deleteLesson(courseId, section.id, lId);
      onLessonDeleted(lId);
    } catch { /* silent */ }
  };

  return (
    <div className="cur-section">
      <div className="cur-section__head" onClick={() => setOpen(!open)}>
        <span className="cur-section__chevron">{open ? "▼" : "▶"}</span>
        <strong className="cur-section__title">Section {index + 1}: {section.title}</strong>
        <span className="cur-section__count">{section.lessons.length} lesson(s)</span>
        <button className="cur-btn cur-btn--danger" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
          Delete
        </button>
      </div>

      {open && (
        <div className="cur-lessons">
          {section.lessons.map((l) => (
            <div key={l.id} className="cur-lesson-wrap">
              <div className="cur-lesson">
                <span className="cur-lesson__icon">
                  {l.type === "video" ? <Video size={15} /> : l.type === "quiz" ? <ListChecks size={15} /> : <FileText size={15} />}
                </span>
                <span className="cur-lesson__title">{l.title}</span>
                {l.is_preview && <span className="cur-lesson__preview">Free Preview</span>}
                <div className="cur-lesson__actions">
                  <button
                    className={`cur-btn cur-btn--resources${expandedResources.has(l.id) ? " cur-btn--resources-active" : ""}`}
                    onClick={() => toggleResources(l.id)}
                    title="Lesson resources"
                  >
                    <Paperclip size={13} /> Resources
                  </button>
                  <button className="cur-btn cur-btn--edit" onClick={() => startEdit(l)} title="Edit lesson">
                    <Pencil size={13} />
                  </button>
                  <button className="cur-btn cur-btn--icon" onClick={() => handleDeleteLesson(l.id)} title="Delete lesson">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {editingId === l.id && (
                <div className="cur-lesson-form cur-lesson-form--edit">
                  <input
                    placeholder="Lesson title *"
                    value={editForm.title}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  />
                  <label className="cur-lesson-form__check">
                    <input
                      type="checkbox"
                      checked={editForm.is_preview}
                      onChange={(e) => setEditForm((f) => ({ ...f, is_preview: e.target.checked }))}
                    />
                    Free Preview
                  </label>
                  {l.type === "video" && (
                    <input
                      placeholder="YouTube / Vimeo URL"
                      value={editForm.video_url}
                      onChange={(e) => setEditForm((f) => ({ ...f, video_url: e.target.value }))}
                    />
                  )}
                  {l.type === "article" && (
                    <textarea
                      rows={3}
                      placeholder="Article content"
                      value={editForm.content}
                      onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                    />
                  )}
                  {editErr && <p style={{ color: "#dc2626", fontSize: 12, margin: 0 }}>⚠ {editErr}</p>}
                  <div className="cur-lesson-form__actions">
                    <button className="cur-btn cur-btn--primary" onClick={() => handleSaveEdit(l)} disabled={editSaving}>
                      {editSaving ? "Saving..." : "Save Changes"}
                    </button>
                    <button className="cur-btn" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              )}

              {expandedResources.has(l.id) && (
                <LessonResourcesPanel courseId={courseId} sectionId={section.id} lessonId={l.id} />
              )}
            </div>
          ))}

          {err && <p style={{ color: "#dc2626", fontSize: 12, margin: "4px 0" }}>⚠ {err}</p>}

          {!showForm ? (
            <button className="cur-add-lesson-btn" onClick={() => { setEditingId(null); setShowForm(true); }}>+ Add Lesson</button>
          ) : (
            <div className="cur-lesson-form">
              <input
                placeholder="Lesson title *"
                value={lesson.title}
                onChange={(e) => setL("title", e.target.value)}
              />
              <div className="cur-lesson-form__row">
                <select value={lesson.type} onChange={(e) => setL("type", e.target.value)}>
                  <option value="video">🎬 Video</option>
                  <option value="article">📄 Article</option>
                </select>
                <label className="cur-lesson-form__check">
                  <input type="checkbox" checked={lesson.is_preview} onChange={(e) => setL("is_preview", e.target.checked)} />
                  Free Preview
                </label>
              </div>
              {lesson.type === "video" && (
                <>
                  <label style={{ fontSize: 12, color: "#6b7280" }}>Upload video (mp4, mov, webm — max 500MB)</label>
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setLesson((prev) => ({ ...prev, videoFile: f, duration: null }));
                      if (f) getVideoDuration(f).then((d) => setL("duration", d)).catch(() => {});
                    }}
                  />
                  {!lesson.videoFile && (
                    <input placeholder="Or paste YouTube / Vimeo URL" value={lesson.video_url} onChange={(e) => setL("video_url", e.target.value)} />
                  )}
                  {uploadProgress !== null && (
                    <div style={{ marginTop: 4 }}>
                      <div style={{ background: "#e5e7eb", borderRadius: 4, height: 6 }}>
                        <div style={{ background: "#14b8a6", height: 6, borderRadius: 4, width: `${uploadProgress}%`, transition: "width 0.3s" }} />
                      </div>
                      <span style={{ fontSize: 11, color: "#6b7280" }}>Uploading {uploadProgress}%</span>
                    </div>
                  )}
                </>
              )}
              {lesson.type === "article" && (
                <>
                  <textarea rows={3} placeholder="Write the article content here..." value={lesson.content} onChange={(e) => setL("content", e.target.value)} />
                  <label style={{ fontSize: 12, color: "#6b7280" }}>Or upload a document (PDF, DOC, PPT — optional, shown as a download for students)</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    onChange={(e) => setL("articleFile", e.target.files?.[0] ?? null)}
                  />
                  {uploadProgress !== null && (
                    <div style={{ marginTop: 4 }}>
                      <div style={{ background: "#e5e7eb", borderRadius: 4, height: 6 }}>
                        <div style={{ background: "#14b8a6", height: 6, borderRadius: 4, width: `${uploadProgress}%`, transition: "width 0.3s" }} />
                      </div>
                      <span style={{ fontSize: 11, color: "#6b7280" }}>Uploading {uploadProgress}%</span>
                    </div>
                  )}
                </>
              )}
              <div className="cur-lesson-form__actions">
                <button className="cur-btn cur-btn--primary" onClick={handleAddLesson} disabled={saving}>
                  {saving ? "Saving..." : "Save Lesson"}
                </button>
                <button className="cur-btn" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// CurriculumSte
interface CurriculumStepProps {
  courseId: number;
  sections: LocalSection[];
  setSections: React.Dispatch<React.SetStateAction<LocalSection[]>>;
  onNext: () => void;
  onBack: () => void;
}

function CurriculumStep({ courseId, sections, setSections, onNext, onBack }: CurriculumStepProps) {
  const navigate = useNavigate();
  const [newTitle, setNewTitle] = useState("");
  const [addingSection, setAddingSection] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [justAddedId, setJustAddedId] = useState<number | null>(null);

  // Section Library state
  const [library, setLibrary] = useState<StandaloneSection[]>([]);
  const [loadingLib, setLoadingLib] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [attaching, setAttaching] = useState(false);
  const [attachErr, setAttachErr] = useState<string | null>(null);

  useEffect(() => {
    instructorService.getStandaloneSections()
      .then(({ data }) => setLibrary(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingLib(false));
  }, []);

  const toggleId = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleAddSection = async () => {
    if (!newTitle.trim()) return;
    setAddingSection(true); setErr(null);
    try {
      const { data } = await instructorService.createSection(courseId, newTitle.trim());
      setSections((prev) => [...prev, { ...data.data, lessons: data.data.lessons ?? [] }]);
      setJustAddedId(data.data.id);
      setNewTitle("");
    } catch (e) { setErr(getApiError(e)); }
    setAddingSection(false);
  };

  const handleDeleteSection = async (sId: number) => {
    if (!window.confirm("Delete this section and all its lessons?")) return;
    try {
      await instructorService.deleteSection(courseId, sId);
      setSections((prev) => prev.filter((s) => s.id !== sId));
    } catch { /* silent */ }
  };

  const handleContinue = async () => {
    if (selectedIds.size > 0) {
      setAttaching(true);
      setAttachErr(null);
      try {
        await instructorService.attachSections(courseId, [...selectedIds]);
        const { data } = await instructorService.getSections(courseId);
        setSections((data.data ?? []).map((s) => ({
          id: s.id,
          title: s.title,
          order: s.order,
          lessons: (s.lessons ?? []).map((l) => ({
            id: l.id, title: l.title, type: l.type, is_preview: l.is_preview,
          })),
        })));
        setSelectedIds(new Set());
      } catch {
        setAttachErr("Failed to attach sections. Please try again.");
        setAttaching(false);
        return;
      }
      setAttaching(false);
    }
    onNext();
  };

  const totalLessons = sections.reduce((sum, s) => sum + s.lessons.length, 0);
  const canProceed = sections.length > 0 || selectedIds.size > 0;

  return (
    <div className="cc-card">
      <div className="cc-card__head">
        <span className="cc-card__icon">🎬</span>
        <h2>Curriculum</h2>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#9ca3af" }}>
          {sections.length + selectedIds.size} sections · {totalLessons} lessons
        </span>
      </div>
      <p className="cc-subtitle">Attach sections from your library, or create new ones directly below.</p>

      {/* Section Library picker */}
      <div className="cur-library">
        <div className="cur-library__head">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 5.5C7 5 9.5 5.4 12 7c2.5-1.6 5-2 8-1.5V18c-3-.5-5.5-.1-8 1.5-2.5-1.6-5-2-8-1.5Z"/>
          </svg>
          <h3>Attach from Section Library</h3>
          {!loadingLib && library.length > 0 && (
            <span className="cur-library__count">{selectedIds.size} selected</span>
          )}
        </div>

        {loadingLib ? (
          <div className="cur-library__loading">
            <div className="cur-lib-spinner" />
          </div>
        ) : library.length === 0 ? (
          <div className="cur-library__empty">
            <p>No standalone sections yet.</p>
            <button className="cur-lib-link" onClick={() => navigate("/instructor/courses/sections")}>
              Build sections in Section Library →
            </button>
          </div>
        ) : (
          <div className="cur-library__list">
            {library.map((s) => (
              <label
                key={s.id}
                className={`cur-lib-item${selectedIds.has(s.id) ? " cur-lib-item--selected" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(s.id)}
                  onChange={() => toggleId(s.id)}
                />
                <div className="cur-lib-item__info">
                  <span className="cur-lib-item__title">{s.title}</span>
                  <span className="cur-lib-item__meta">
                    {s.lessons_count === 0 ? "No lessons yet" : `${s.lessons_count} lesson${s.lessons_count !== 1 ? "s" : ""}`}
                  </span>
                </div>
                {selectedIds.has(s.id) && (
                  <span className="cur-lib-item__check">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                  </span>
                )}
              </label>
            ))}
          </div>
        )}

        {attachErr && <p className="cur-library__err">⚠ {attachErr}</p>}
      </div>

      {/* Divider */}
      <div className="cur-divider"><span>or create sections directly</span></div>

      {err && <div className="cc-error" style={{ marginBottom: 16 }}>⚠ {err}</div>}

      {sections.length === 0 && (
        <div className="cur-empty">
          No sections created yet. Type a title in the box below and click <strong>+ Add Section</strong> to create your first one.
        </div>
      )}

      <div className="cur-sections">
        {sections.map((section, idx) => (
          <SectionBlock
            key={section.id}
            section={section}
            index={idx}
            courseId={courseId}
            autoOpenForm={section.id === justAddedId}
            onDelete={() => handleDeleteSection(section.id)}
            onLessonAdded={(lesson) =>
              setSections((prev) => prev.map((s) =>
                s.id === section.id ? { ...s, lessons: [...s.lessons, lesson] } : s
              ))
            }
            onLessonDeleted={(lId) =>
              setSections((prev) => prev.map((s) =>
                s.id === section.id ? { ...s, lessons: s.lessons.filter((l) => l.id !== lId) } : s
              ))
            }
            onLessonUpdated={(lId, fields) =>
              setSections((prev) => prev.map((s) =>
                s.id === section.id
                  ? { ...s, lessons: s.lessons.map((l) => l.id === lId ? { ...l, ...fields } : l) }
                  : s
              ))
            }
          />
        ))}
      </div>

      {/* Add section */}
      <p className="cur-hint">Enter a title to enable the + Add Section button.</p>
      <div className="cur-add-section">
        <input
          placeholder="Section title e.g. Introduction to HTML"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
        />
        <button
          className="cur-btn cur-btn--primary"
          onClick={handleAddSection}
          disabled={addingSection || !newTitle.trim()}
        >
          {addingSection ? "Adding..." : "+ Add Section"}
        </button>
      </div>

      <div className="cc-actions" style={{ marginTop: 20 }}>
        <button className="cc-discard" onClick={onBack}>← Back</button>
        <button
          className="cc-continue"
          onClick={handleContinue}
          disabled={!canProceed || attaching}
          style={{ opacity: canProceed ? 1 : 0.4 }}
        >
          {attaching ? "Attaching…" : "Continue to Pricing →"}
        </button>
      </div>
    </div>
  );
}

// CreateCours
const DEFAULT_INFO = {
  title: "", category_id: "", level: "beginner",
  language: "English", short_description: "", description: "",
  requirements: "", what_you_will_learn: "",
};

export default function CreateCourse() {
  const navigate = useNavigate();

  // Restore draft saved before last refresh
  const draft = loadDraft();

  const [step, setStep]       = useState(draft?.step ?? 0);
  const [courseId, setCourseId] = useState<number | null>(draft?.courseId ?? null);
  const [sections, setSections] = useState<LocalSection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const [info, setInfo]       = useState<Draft["info"]>(draft?.info ?? DEFAULT_INFO);
  const [visibility, setVisibility] = useState(draft?.visibility ?? "public");
  const [isFree, setIsFree]   = useState(draft?.isFree ?? true);
  const [price, setPrice]     = useState(draft?.price ?? "");
  const [commission, setCommission] = useState(20);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [previewVideoFile, setPreviewVideoFile] = useState<File | null>(null);
  const [previewVideoPreview, setPreviewVideoPreview] = useState<string | null>(null);
  const [previewVideoUploadProgress, setPreviewVideoUploadProgress] = useState<number | null>(null);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handlePreviewVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewVideoFile(file);
    setPreviewVideoPreview(URL.createObjectURL(file));
  };

  // Persist draft on every relevant state change (File objects are not serialisable — skip thumbnail)
  useEffect(() => {
    saveDraft({ step, courseId, info, visibility, isFree, price });
  }, [step, courseId, info, visibility, isFree, price]);

  // Re-fetch sections + commission when courseId is restored from draft on refresh
  useEffect(() => {
    if (!courseId) return;
    instructorService.getCourseById(courseId)
      .then(({ data }) => {
        if (data.data.commission_percentage !== undefined) setCommission(data.data.commission_percentage);
      })
      .catch(() => {});
    if (sections.length > 0) return;
    instructorService.getSections(courseId)
      .then(({ data }) =>
        setSections((data.data ?? []).map((s) => ({
          id: s.id,
          title: s.title,
          order: s.order,
          lessons: (s.lessons ?? []).map((l) => ({
            id: l.id, title: l.title, type: l.type, is_preview: l.is_preview,
          })),
        })))
      )
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => {
    categoryService.getAll()
      .then(({ data }) => setCategories(data.data ?? []))
      .catch(() => {});
  }, []);

  const setI = (k: string, v: string) => setInfo((f) => ({ ...f, [k]: v }));
  const selectedCategory = categories.find((c) => String(c.id) === info.category_id);

  // Step 0: Create or update course
  const handleCreateCourse = async () => {
    if (saving) return;
    if (!info.title.trim()) { setError("Course title is required."); return; }
    if (!info.category_id)  { setError("Please select a category."); return; }
    setSaving(true); setError(null);
    try {
      const payload = {
        title: info.title,
        short_description: info.short_description,
        description: info.description,
        level: info.level,
        language: info.language,
        category_id: Number(info.category_id),
      };

      const uploadPreviewVideo = async (id: number) => {
        if (!previewVideoFile) return;
        setPreviewVideoUploadProgress(0);
        try { await instructorService.uploadPreviewVideo(id, previewVideoFile, setPreviewVideoUploadProgress); }
        catch { /* non-blocking */ }
        setPreviewVideoUploadProgress(null);
      };

      if (courseId) {
        // Updating existing course — don't create a duplicate
        const { data: upd } = await instructorService.updateCourse(courseId, payload);
        if (upd.data.commission_percentage !== undefined) setCommission(upd.data.commission_percentage);
        if (thumbnailFile) {
          try { await instructorService.uploadThumbnail(courseId, thumbnailFile); } catch { /* non-blocking */ }
        }
        await uploadPreviewVideo(courseId);
      } else {
        const { data } = await instructorService.createCourse(payload);
        const newId = data.data.id;
        setCourseId(newId);
        if (data.data.commission_percentage !== undefined) setCommission(data.data.commission_percentage);
        if (thumbnailFile) {
          try { await instructorService.uploadThumbnail(newId, thumbnailFile); } catch { /* non-blocking */ }
        }
        await uploadPreviewVideo(newId);
      }
      setStep(1);
    } catch (err) { setError(getApiError(err)); }
    setSaving(false);
  };

  // Step 2: Save pric─
  const handleSavePrice = async () => {
    if (saving) return;
    if (!isFree && (!price || Number(price) < 0)) {
      setError("Please enter a valid price.");
      return;
    }
    if (!courseId) return;
    setSaving(true); setError(null);
    try {
      await instructorService.updateCourse(courseId, {
        price: isFree ? "0" : String(Number(price)),
      });
      setStep(3);
    } catch (err) { setError(getApiError(err)); }
    setSaving(false);
  };

  const totalLessons = sections.reduce((sum, s) => sum + s.lessons.length, 0);

  const submitIssues: { step: number; label: string }[] = [
    ...(!info.title.trim()    ? [{ step: 0, label: "Course title is required" }] : []),
    ...(!info.category_id     ? [{ step: 0, label: "Category is required" }] : []),
    ...(!courseId             ? [{ step: 0, label: 'Basic Info must be saved — click "Continue"' }] : []),
    ...(sections.length === 0 ? [{ step: 1, label: "Add at least one section" }] : []),
    ...(totalLessons === 0    ? [{ step: 1, label: "Add at least one lesson to your sections" }] : []),
    ...(!isFree && (!price || Number(price) <= 0) ? [{ step: 2, label: "Enter a valid price for your paid course" }] : []),
  ];

  // Step 3: Submit for review
  const handleSubmit = async () => {
    if (saving || !courseId || submitIssues.length > 0) return;
    setSaving(true); setError(null);
    try {
      await instructorService.updateCourse(courseId, {
        price: isFree ? "0" : String(Number(price)),
        visibility,
      });
      await instructorService.submitForReview(courseId);
      clearDraft();
      navigate("/instructor/courses");
    } catch (err) { setError(getApiError(err)); }
    setSaving(false);
  };

  return (
    <div className="cc-wrap">
      {/* Page header */}
      <div className="cc-header">
        <h1>Create New Course</h1>
        <p>Fill in the details below to publish your course on the platform.</p>
      </div>

      {/* Step tabs — all always clickable */}
      <div className="cc-tabs">
        {STEPS.map((label, i) => {
          const active = i === step;
          // ✓ only when the step's required content is actually filled
          const done =
            i === 0 ? !!courseId :
            i === 1 ? sections.length > 0 && totalLessons > 0 :
            i === 2 ? (isFree || Number(price) > 0) :
            false;
          return (
            <button
              key={label}
              className={`cc-tab${active ? " cc-tab--active" : ""}${done ? " cc-tab--done" : " cc-tab--reachable"}`}
              onClick={() => { if (!active) setStep(i); }}
            >
              <span className="cc-tab__num">{done ? "✓" : i + 1}</span>
              {label}
            </button>
          );
        })}
      </div>

      <div className={`cc-body${step === 1 ? " cc-body--full" : ""}`}>
        <div className="cc-main">
          {error && <div className="cc-error">⚠ {error}</div>}

          {/* STEP 0: Basic Info */}
          {step === 0 && (
            <div className="cc-card">
              <div className="cc-card__head">
                <span className="cc-card__icon">📝</span>
                <h2>Course Basic Information</h2>
              </div>

              <div className="cc-field">
                <label>Course Title <span className="cc-req">*</span></label>
                <input
                  placeholder="e.g. Master React and Tailwind CSS in 30 Days"
                  value={info.title}
                  onChange={(e) => setI("title", e.target.value)}
                />
              </div>

              <div className="cc-field">
                <label>Short Description <span className="cc-char">{info.short_description.length}/160</span></label>
                <input
                  placeholder="1-2 sentences shown on course card (e.g. Learn CSS from scratch)"
                  maxLength={160}
                  value={info.short_description}
                  onChange={(e) => setI("short_description", e.target.value)}
                />
              </div>

              <div className="cc-field">
                <label>Course Thumbnail</label>
                <label className="cc-thumb-upload">
                  {thumbnailPreview ? (
                    <img src={thumbnailPreview} alt="Thumbnail preview" className="cc-thumb-preview" />
                  ) : (
                    <div className="cc-thumb-placeholder">
                      <span className="cc-thumb-placeholder__icon">🖼</span>
                      <span className="cc-thumb-placeholder__text">Click to upload image</span>
                      <span className="cc-thumb-placeholder__hint">JPG, PNG — recommended 1280×720</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }}
                    onChange={handleThumbnailChange}
                  />
                </label>
                {thumbnailFile && (
                  <button
                    type="button"
                    className="cc-thumb-remove"
                    onClick={() => { setThumbnailFile(null); setThumbnailPreview(null); }}
                  >
                    ✕ Remove image
                  </button>
                )}
              </div>

              <div className="cc-row">
                <div className="cc-field">
                  <label>Category <span className="cc-req">*</span></label>
                  <select value={info.category_id} onChange={(e) => setI("category_id", e.target.value)}>
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={String(c.id)}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="cc-field">
                  <label>Level <span className="cc-req">*</span></label>
                  <select value={info.level} onChange={(e) => setI("level", e.target.value)}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="cc-field">
                <label>Primary Language</label>
                <select value={info.language} onChange={(e) => setI("language", e.target.value)}>
                  <option>English</option>
                  <option>Khmer</option>
                  {/* <option>French</option> */}
                </select>
              </div>

              <div className="cc-field">
                <label>Description <span className="cc-char">{info.description.length}/3000</span></label>
                <textarea
                  rows={5} maxLength={3000}
                  placeholder="Tell your students what they will learn..."
                  value={info.description}
                  onChange={(e) => setI("description", e.target.value)}
                />
              </div>

              <div className="cc-field">
                <label>Preview Video <span className="cc-char">Optional — a short trailer shown to prospective students</span></label>
                {previewVideoPreview ? (
                  <video src={previewVideoPreview} controls className="cc-thumb-preview" />
                ) : (
                  <label className="cc-thumb-upload">
                    <div className="cc-thumb-placeholder">
                      <span className="cc-thumb-placeholder__icon">🎬</span>
                      <span className="cc-thumb-placeholder__text">Click to upload video</span>
                      <span className="cc-thumb-placeholder__hint">MP4, MOV, WebM</span>
                    </div>
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
                      style={{ display: "none" }}
                      onChange={handlePreviewVideoChange}
                    />
                  </label>
                )}
                {previewVideoUploadProgress !== null && (
                  <p className="cc-thumb-placeholder__hint">Uploading… {previewVideoUploadProgress}%</p>
                )}
                {previewVideoFile && previewVideoUploadProgress === null && (
                  <button
                    type="button"
                    className="cc-thumb-remove"
                    onClick={() => { setPreviewVideoFile(null); setPreviewVideoPreview(null); }}
                  >
                    ✕ Remove video
                  </button>
                )}
              </div>

              <div className="cc-field">
                <label>What You Will Learn</label>
                <textarea
                  rows={4}
                  placeholder="List key skills students will gain, one per line"
                  value={info.what_you_will_learn}
                  onChange={(e) => setI("what_you_will_learn", e.target.value)}
                />
              </div>

              <div className="cc-field">
                <label>Requirements</label>
                <textarea
                  rows={4}
                  placeholder="List prerequisites, one per line"
                  value={info.requirements}
                  onChange={(e) => setI("requirements", e.target.value)}
                />
              </div>

              <div className="cc-actions">
                <button className="cc-discard" onClick={() => { clearDraft(); navigate("/instructor/courses"); }}>✕ Discard</button>
                <button className="cc-continue" onClick={handleCreateCourse} disabled={saving}>
                  {saving ? "Saving..." : "Continue →"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: Curriculum */}
          {step === 1 && (
            courseId ? (
              <CurriculumStep
                courseId={courseId}
                sections={sections}
                setSections={setSections}
                onNext={() => { setError(null); setStep(2); }}
                onBack={() => setStep(0)}
              />
            ) : (
              <div className="cc-card">
                <div className="cc-card__head">
                  <span className="cc-card__icon">🎬</span>
                  <h2>Curriculum</h2>
                </div>
                <div className="cc-notice">
                  <p>Save your <strong>Basic Info</strong> first to start building the curriculum.</p>
                  <button className="cc-continue" onClick={() => setStep(0)}>← Go to Basic Info</button>
                </div>
              </div>
            )
          )}

          {/* STEP 2: Pricing */}
          {step === 2 && (
            <div className="cc-card">
              <div className="cc-card__head">
                <span className="cc-card__icon"><Wallet size={20} /></span>
                <h2>Set your course price</h2>
              </div>
              <p className="cc-subtitle">Choose a pricing model for your course.</p>

              <div className="cc-price-options">
                <button
                  className={`cc-price-opt${isFree ? " cc-price-opt--active" : ""}`}
                  onClick={() => { setIsFree(true); setPrice(""); }}
                >
                  <span className="cc-price-opt__icon"><Gift size={26} /></span>
                  <strong>Free</strong>
                  <span>Free access</span>
                </button>
                <button
                  className={`cc-price-opt${!isFree ? " cc-price-opt--active" : ""}`}
                  onClick={() => setIsFree(false)}
                >
                  <span className="cc-price-opt__icon"><Banknote size={26} /></span>
                  <strong>Paid</strong>
                  <span>Set a price</span>
                </button>
              </div>

              {!isFree && (
                <div className="cc-field" style={{ marginTop: 20, maxWidth: 240 }}>
                  <label>Price (USD)</label>
                  <div className="cc-price-input">
                    <span>$</span>
                    <input
                      type="number" min="1" step="0.01"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Commission info — read-only from backend, only for paid courses */}
              {!isFree && (
                <div className="cc-commission-info">
                  <div className="cc-commission-info__row">
                    <span>Platform commission</span>
                    <span className="cc-commission-info__val">{commission}%</span>
                  </div>
                  <div className="cc-commission-info__row">
                    <span>Your earnings rate</span>
                    <span className="cc-commission-info__val cc-commission-info__val--green">{100 - commission}%</span>
                  </div>
                  {price && Number(price) > 0 && (
                    <div className="cc-commission-info__row cc-commission-info__row--highlight">
                      <span>You earn per sale</span>
                      <span className="cc-commission-info__val cc-commission-info__val--green">
                        ${(Number(price) * (1 - commission / 100)).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <p className="cc-commission-info__note">Commission rate is set by the platform admin and applied to each sale.</p>
                </div>
              )}

              <div className="cc-actions" style={{ marginTop: 24 }}>
                <button className="cc-discard" onClick={() => setStep(1)}>← Back</button>
                <button className="cc-continue" onClick={handleSavePrice} disabled={saving}>
                  {saving ? "Saving..." : " Continue →"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Submit */}
          {step === 3 && (
            <div className="cc-card">
              <div className="cc-submit-hero">
                <span className="cc-submit-hero__icon">{submitIssues.length === 0 ? "🚀" : "📋"}</span>
                <h2>{submitIssues.length === 0 ? "Ready to Submit!" : "Almost there…"}</h2>
                <p><strong>{info.title || "Untitled course"}</strong></p>
              </div>

              {/* Full review — everything the instructor entered, so they can check it before submitting */}
              <div className="cc-review">
                <div className="cc-review__group">
                  <h3 className="cc-review__heading">Basic Info</h3>
                  <div className="cc-review__grid">
                    <div className="cc-review__item"><span>Category</span><strong>{selectedCategory?.name ?? "—"}</strong></div>
                    <div className="cc-review__item"><span>Level</span><strong>{info.level || "—"}</strong></div>
                    <div className="cc-review__item"><span>Language</span><strong>{info.language || "—"}</strong></div>
                    <div className="cc-review__item"><span>Thumbnail</span><strong>{thumbnailPreview ? "Uploaded" : "Not set"}</strong></div>
                  </div>
                  {info.short_description && <p className="cc-review__text">{info.short_description}</p>}
                </div>

                <div className="cc-review__group">
                  <h3 className="cc-review__heading">
                    Curriculum <span className="cc-review__heading-count">{sections.length} section(s) · {totalLessons} lesson(s)</span>
                  </h3>
                  {sections.length === 0 ? (
                    <p className="cc-review__text cc-review__text--muted">No sections added yet.</p>
                  ) : (
                    <ul className="cc-review__curriculum">
                      {sections.map((s, i) => (
                        <li key={s.id}>
                          <span className="cc-review__curriculum-num">{i + 1}</span>
                          <span className="cc-review__curriculum-title">{s.title}</span>
                          <span className="cc-review__curriculum-count">
                            {s.lessons.length} lesson{s.lessons.length !== 1 ? "s" : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="cc-review__group">
                  <h3 className="cc-review__heading">Pricing</h3>
                  <div className="cc-review__grid">
                    <div className="cc-review__item"><span>Model</span><strong>{isFree ? "Free" : "Paid"}</strong></div>
                    {!isFree && <div className="cc-review__item"><span>Price</span><strong>${price || "0.00"}</strong></div>}
                    {!isFree && <div className="cc-review__item"><span>You earn per sale</span><strong>${(Number(price || 0) * (1 - commission / 100)).toFixed(2)}</strong></div>}
                  </div>
                </div>
              </div>

              {/* Validation issues — clickable links to each step */}
              {submitIssues.length > 0 && (
                <div className="cc-submit-issues">
                  <p className="cc-submit-issues__title">Complete the following before submitting:</p>
                  <ul>
                    {submitIssues.map((issue) => (
                      <li key={issue.label}>
                        <button className="cc-submit-issues__link" onClick={() => setStep(issue.step)}>
                          <span className="cc-submit-issues__step">{STEPS[issue.step]}</span>
                          {issue.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="cc-field">
                <label>Visibility</label>
                <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                  <option value="public">🌐 Public — anyone can find this course</option>
                  <option value="private">🔒 Private — only enrolled students</option>
                </select>
              </div>

              <div className="cc-submit-actions">
                <button className="cc-discard" onClick={() => setStep(2)}>← Back</button>
                <button
                  className="cc-submit-btn"
                  onClick={handleSubmit}
                  disabled={saving || submitIssues.length > 0}
                  style={submitIssues.length > 0 ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
                >
                  {saving ? "Submitting..." : "✓ Submit for Review"}
                </button>
              </div>
              <p className="cc-submit-note">Admin will review and publish your course after submission.</p>
            </div>
          )}
        </div>

        {/* Right: Preview + Checklist (not on curriculum step) */}
        {step !== 1 && (
          <aside className="cc-aside">
            <div className="cc-preview">
              <div className="cc-preview__thumb" style={thumbnailPreview ? { backgroundImage: `url(${thumbnailPreview})`, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat" } : undefined}>
                {!thumbnailPreview && <button className="cc-preview__play">▶</button>}
              </div>
              <div className="cc-preview__body">
                <p className="cc-preview__label">Course Preview</p>
                <p className="cc-preview__title">{info.title || "Your Course Title"}</p>
                <div className="cc-preview__tags">
                  <span>{selectedCategory?.name ?? "Category"}</span>
                  <span>{info.level}</span>
                </div>
                <div className="cc-preview__divider" />
                <div className="cc-preview__meta">
                  <div className="cc-preview__row"><span>Status</span><span className="cc-status-draft">Draft</span></div>
                  <div className="cc-preview__row"><span>Step</span><span>{step + 1} / {STEPS.length}</span></div>
                  <div className="cc-preview__row"><span>Sections</span><span>{sections.length}</span></div>
                  <div className="cc-preview__row"><span>Price</span><span>{isFree ? "Free" : price ? `$${price}` : "—"}</span></div>
                </div>
              </div>
            </div>

            <div className="cc-checklist">
              <div className="cc-checklist__head"><span>≡</span> Completion Checklist</div>
              <ul>
                {[
                  { label: "Course title added",      done: info.title.trim().length > 0 },
                  { label: "Category selected",       done: info.category_id !== "" },
                  { label: "Section added",           done: sections.length > 0 },
                  { label: "Lesson added",            done: totalLessons > 0 },
                  { label: "Price set",               done: isFree || Number(price) > 0 },
                ].map((item) => (
                  <li key={item.label} className={item.done ? "cc-check--done" : ""}>
                    <span className="cc-check__box">{item.done ? "✓" : ""}</span>
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
