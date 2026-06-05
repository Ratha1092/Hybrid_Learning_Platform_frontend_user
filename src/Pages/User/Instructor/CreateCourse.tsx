import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { instructorService } from "../../../services/instructorService";
import api from "../../../api/axios";
import "./CreateCourse.css";

interface Category { id: number; name: string; slug: string; }

interface LocalLesson {
  id: number; title: string; type: string; is_preview: boolean; video_url?: string;
}
interface LocalSection {
  id: number; title: string; order?: number; lessons: LocalLesson[];
}
interface LessonForm {
  title: string; type: string; video_url: string; content: string; is_preview: boolean; videoFile: File | null;
}

const STEPS = ["Basic Info", "Curriculum", "Pricing", "Submit"];

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

// ── SectionBlock ──────────────────────────────────────────────────────────────
interface SectionBlockProps {
  section: LocalSection;
  index: number;
  courseId: number;
  onDelete: () => void;
  onLessonAdded: (lesson: LocalLesson) => void;
  onLessonDeleted: (id: number) => void;
}

function SectionBlock({ section, index, courseId, onDelete, onLessonAdded, onLessonDeleted }: SectionBlockProps) {
  const [open, setOpen] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [lesson, setLesson] = useState<LessonForm>({ title: "", type: "video", video_url: "", content: "", is_preview: false, videoFile: null });
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const setL = (k: keyof LessonForm, v: string | boolean) => setLesson((f) => ({ ...f, [k]: v }));

  const handleAddLesson = async () => {
    if (!lesson.title.trim()) return;
    setSaving(true); setErr(null);
    try {
      const { data } = await instructorService.createLesson(courseId, section.id, {
        title: lesson.title.trim(),
        type: lesson.type,
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
      onLessonAdded({ ...data.data, lessons: undefined } as unknown as LocalLesson);
      setLesson({ title: "", type: "video", video_url: "", content: "", is_preview: false, videoFile: null });
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
            <div key={l.id} className="cur-lesson">
              <span className="cur-lesson__icon">{l.type === "video" ? "🎬" : l.type === "quiz" ? "📝" : "📄"}</span>
              <span className="cur-lesson__title">{l.title}</span>
              {l.is_preview && <span className="cur-lesson__preview">Free Preview</span>}
              <button className="cur-btn cur-btn--icon" onClick={() => handleDeleteLesson(l.id)}>✕</button>
            </div>
          ))}

          {err && <p style={{ color: "#dc2626", fontSize: 12, margin: "4px 0" }}>⚠ {err}</p>}

          {!showForm ? (
            <button className="cur-add-lesson-btn" onClick={() => setShowForm(true)}>+ Add Lesson</button>
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
                  <option value="quiz">📝 Quiz</option>
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
                    onChange={(e) => setLesson((f) => ({ ...f, videoFile: e.target.files?.[0] ?? null }))}
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
                <textarea rows={3} placeholder="Article content..." value={lesson.content} onChange={(e) => setL("content", e.target.value)} />
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

// ── CurriculumStep ────────────────────────────────────────────────────────────
interface CurriculumStepProps {
  courseId: number;
  sections: LocalSection[];
  setSections: React.Dispatch<React.SetStateAction<LocalSection[]>>;
  onNext: () => void;
  onBack: () => void;
}

function CurriculumStep({ courseId, sections, setSections, onNext, onBack }: CurriculumStepProps) {
  const [newTitle, setNewTitle] = useState("");
  const [addingSection, setAddingSection] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleAddSection = async () => {
    if (!newTitle.trim()) return;
    setAddingSection(true); setErr(null);
    try {
      const { data } = await instructorService.createSection(courseId, newTitle.trim());
      setSections((prev) => [...prev, { ...data.data, lessons: data.data.lessons ?? [] }]);
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

  const totalLessons = sections.reduce((sum, s) => sum + s.lessons.length, 0);
  const canProceed = sections.length > 0 && totalLessons > 0;

  return (
    <div className="cc-card">
      <div className="cc-card__head">
        <span className="cc-card__icon">🎬</span>
        <h2>Curriculum</h2>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#9ca3af" }}>
          {sections.length} sections · {totalLessons} lessons
        </span>
      </div>
      <p className="cc-subtitle">Add sections, then add lessons inside each section.</p>

      {err && <div className="cc-error" style={{ marginBottom: 16 }}>⚠ {err}</div>}

      {sections.length === 0 && (
        <div className="cur-empty">No sections yet. Add your first section below.</div>
      )}

      <div className="cur-sections">
        {sections.map((section, idx) => (
          <SectionBlock
            key={section.id}
            section={section}
            index={idx}
            courseId={courseId}
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
          />
        ))}
      </div>

      {/* Add section */}
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
          onClick={onNext}
          disabled={!canProceed}
          style={{ opacity: canProceed ? 1 : 0.4 }}
        >
          Continue to Pricing →
        </button>
      </div>
    </div>
  );
}

// ── CreateCourse ──────────────────────────────────────────────────────────────
export default function CreateCourse() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [sections, setSections] = useState<LocalSection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [info, setInfo] = useState({
    title: "", category_id: "", level: "beginner",
    language: "English", short_description: "", description: "",
    preview_video_url: "", requirements: "", what_you_will_learn: "",
  });
  const [certificateEnabled, setCertificateEnabled] = useState(false);
  const [visibility, setVisibility] = useState("public");
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    api.get<{ data: Category[] }>("/categories")
      .then(({ data }) => setCategories(data.data ?? []))
      .catch(() => {});
  }, []);

  const setI = (k: string, v: string) => setInfo((f) => ({ ...f, [k]: v }));
  const selectedCategory = categories.find((c) => String(c.id) === info.category_id);

  // ── Step 0: Create course ──────────────────────────────────────────────────
  const handleCreateCourse = async () => {
    if (saving) return;
    if (!info.title.trim()) { setError("Course title is required."); return; }
    if (!info.category_id)  { setError("Please select a category."); return; }
    setSaving(true); setError(null);
    try {
      const { data } = await instructorService.createCourse({
        title: info.title,
        short_description: info.short_description,
        description: info.description,
        level: info.level,
        language: info.language,
        category_id: Number(info.category_id),
      });
      const newId = data.data.id;
      setCourseId(newId);
      if (thumbnailFile) {
        try { await instructorService.uploadThumbnail(newId, thumbnailFile); } catch { /* non-blocking */ }
      }
      setStep(1);
    } catch (err) { setError(getApiError(err)); }
    setSaving(false);
  };

  // ── Step 2: Save price ─────────────────────────────────────────────────────
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

  // ── Step 3: Submit for review ──────────────────────────────────────────────
  const handleSubmit = async () => {
    if (saving || !courseId) return;
    setSaving(true); setError(null);
    try {
      await instructorService.updateCourse(courseId, {
        certificate_enabled: certificateEnabled,
        visibility,
      });
      await instructorService.submitForReview(courseId);
      navigate("/instructor/courses");
    } catch (err) { setError(getApiError(err)); }
    setSaving(false);
  };

  const totalLessons = sections.reduce((sum, s) => sum + s.lessons.length, 0);

  return (
    <div className="cc-wrap">
      {/* Step tabs */}
      <div className="cc-tabs">
        {STEPS.map((label, i) => (
          <button
            key={label}
            className={`cc-tab${step === i ? " cc-tab--active" : ""}${i < step ? " cc-tab--done" : ""}`}
            onClick={() => { if (i < step) setStep(i); }}
          >
            <span className="cc-tab__num">{i < step ? "✓" : i + 1}</span>
            {label}
          </button>
        ))}
      </div>

      <div className={`cc-body${step === 1 ? " cc-body--full" : ""}`}>
        <div className="cc-main">
          {error && <div className="cc-error">⚠ {error}</div>}

          {/* ── STEP 0: Basic Info ── */}
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
                  <option>French</option>
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
                <label>Preview Video URL</label>
                <input
                  placeholder="https://youtube.com/watch?v=..."
                  value={info.preview_video_url}
                  onChange={(e) => setI("preview_video_url", e.target.value)}
                />
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
                <button className="cc-discard" onClick={() => navigate("/instructor/courses")}>✕ Discard</button>
                <button className="cc-continue" onClick={handleCreateCourse} disabled={saving}>
                  {saving ? "Creating..." : "Save & Continue →"}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 1: Curriculum ── */}
          {step === 1 && courseId && (
            <CurriculumStep
              courseId={courseId}
              sections={sections}
              setSections={setSections}
              onNext={() => { setError(null); setStep(2); }}
              onBack={() => setStep(0)}
            />
          )}

          {/* ── STEP 2: Pricing ── */}
          {step === 2 && (
            <div className="cc-card">
              <div className="cc-card__head">
                <span className="cc-card__icon">💰</span>
                <h2>Set your course price</h2>
              </div>
              <p className="cc-subtitle">Choose a pricing model for your course.</p>

              <div className="cc-price-options">
                <button
                  className={`cc-price-opt${isFree ? " cc-price-opt--active" : ""}`}
                  onClick={() => { setIsFree(true); setPrice(""); }}
                >
                  <span className="cc-price-opt__icon">🆓</span>
                  <strong>Free</strong>
                  <span>Free access</span>
                </button>
                <button
                  className={`cc-price-opt${!isFree ? " cc-price-opt--active" : ""}`}
                  onClick={() => setIsFree(false)}
                >
                  <span className="cc-price-opt__icon">💵</span>
                  <strong>Paid</strong>
                  <span>Set a price</span>
                </button>
              </div>

              {!isFree && (
                <div className="cc-field" style={{ marginTop: 20, maxWidth: 200 }}>
                  <label>Price (USD)</label>
                  <div className="cc-price-input">
                    <span>$</span>
                    <input
                      type="number" min="1" step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="cc-actions" style={{ marginTop: 24 }}>
                <button className="cc-discard" onClick={() => setStep(1)}>← Back</button>
                <button className="cc-continue" onClick={handleSavePrice} disabled={saving}>
                  {saving ? "Saving..." : "Save & Continue →"}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Submit ── */}
          {step === 3 && (
            <div className="cc-card">
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>🚀</div>
                <h2 style={{ margin: "0 0 8px" }}>Ready to Submit!</h2>
                <p style={{ color: "#6b7280", fontSize: 14 }}>
                  <strong>{info.title}</strong><br />
                  {sections.length} section(s) · {totalLessons} lesson(s) ·{" "}
                  {isFree ? "Free" : `$${price}`}
                </p>
              </div>

              <div className="cc-field">
                <label>Visibility</label>
                <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                  <option value="public">🌐 Public — anyone can find this course</option>
                  <option value="private">🔒 Private — only enrolled students</option>
                </select>
              </div>

              <div className="cc-field">
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={certificateEnabled}
                    onChange={(e) => setCertificateEnabled(e.target.checked)}
                  />
                  Enable certificate on course completion
                </label>
              </div>

              <p style={{ color: "#6b7280", fontSize: 13, marginTop: 16, textAlign: "center" }}>
                After submitting, admin will review and publish your course.
              </p>

              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
                <button className="cc-discard" onClick={() => setStep(2)}>← Back</button>
                <button
                  className="cc-continue"
                  style={{ background: "#22c55e", padding: "10px 28px", fontSize: 15 }}
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? "Submitting..." : "✓ Submit for Review"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Preview + Checklist (not on curriculum step) ── */}
        {step !== 1 && (
          <aside className="cc-aside">
            <div className="cc-preview">
              <div className="cc-preview__thumb" style={thumbnailPreview ? { backgroundImage: `url(${thumbnailPreview})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
                {!thumbnailPreview && <button className="cc-preview__play">▶</button>}
              </div>
              <div className="cc-preview__body">
                <p className="cc-preview__title">{info.title || "Your Course Title"}</p>
                <div className="cc-preview__tags">
                  <span>{selectedCategory?.name ?? "Category"}</span>
                  <span>{info.level}</span>
                </div>
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
