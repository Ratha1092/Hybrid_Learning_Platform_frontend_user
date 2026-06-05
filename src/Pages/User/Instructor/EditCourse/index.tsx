import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { instructorService, type InstructorCourse } from "../../../../services/instructorService";
import Curriculum from "./Curriculum";
import "./EditCourse.css";

type Tab = "info" | "curriculum";

export default function EditCourse() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<InstructorCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("info");
  const [form, setForm] = useState({
    title: "", short_description: "", description: "", price: "0", level: "beginner",
    preview_video_url: "", requirements: "", what_you_will_learn: "",
    certificate_enabled: false, visibility: "public",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    if (!id) return;
    instructorService.getCourseById(id)
      .then(({ data }) => {
        const c = data.data;
        setCourse(c);
        setForm({
          title: c.title,
          short_description: c.short_description ?? "",
          description: c.description ?? "",
          price: c.price,
          level: c.level,
          preview_video_url: c.preview_video_url ?? "",
          requirements: c.requirements ?? "",
          what_you_will_learn: c.what_you_will_learn ?? "",
          certificate_enabled: c.certificate_enabled ?? false,
          visibility: c.visibility ?? "public",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const getError = (err: unknown): string => {
    const e = err as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } }; message?: string };
    if ((e.response?.status ?? 0) >= 500) return "Something went wrong. Please try again.";
    const errs = e.response?.data?.errors;
    if (errs) return Object.values(errs).flat().join(" ");
    const msg = e.response?.data?.message ?? e.message ?? "Failed to save.";
    if (["SQLSTATE", "SQL:", "pgsql", "transaction", "constraint", "duplicate key"].some((k) => msg.includes(k)))
      return "Something went wrong. Please try again.";
    return msg;
  };

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (saving || !id) return;
    setSaving(true);
    setError(null);
    try {
      const { data } = await instructorService.updateCourse(id, form);
      setCourse(data.data);
      if (thumbnailFile) {
        await instructorService.uploadThumbnail(id, thumbnailFile);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      setError(getError(err));
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="ec-loading">
        <div className="ec-spinner" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="ec-loading">
        <p>Course not found.</p>
      </div>
    );
  }

  return (
    <div className="ec-page">
      <div className="ec-header">
        <button className="ec-back" onClick={() => navigate("/instructor/courses")}>← My Courses</button>
        <h1 className="ec-title">{course.title}</h1>
      </div>

      {/* Tabs */}
      <div className="ec-tabs">
        <button
          className={`ec-tab${tab === "info" ? " ec-tab--active" : ""}`}
          onClick={() => setTab("info")}
        >
          📝 Basic Info
        </button>
        <button
          className={`ec-tab${tab === "curriculum" ? " ec-tab--active" : ""}`}
          onClick={() => setTab("curriculum")}
        >
          🎬 Curriculum
        </button>
      </div>

      {/* Info tab */}
      {tab === "info" && (
        <div className="ec-card">
          {saved && <div className="ec-success">✅ Saved successfully!</div>}
          {error && <div className="ec-error">⚠ {error}</div>}
          <form onSubmit={handleSave} className="ec-form">
            <div className="ec-field">
              <label>Thumbnail</label>
              <label className="ec-thumb-upload">
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="Preview" className="ec-thumb-preview" />
                ) : course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt="Current thumbnail" className="ec-thumb-preview" />
                ) : (
                  <div className="ec-thumb-placeholder">
                    <span>🖼</span>
                    <span>Click to upload thumbnail</span>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>JPG, PNG — 1280×720 recommended</span>
                  </div>
                )}
                <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleThumbnailChange} />
              </label>
              {thumbnailFile && (
                <button type="button" className="ec-thumb-remove" onClick={() => { setThumbnailFile(null); setThumbnailPreview(null); }}>
                  ✕ Remove new image
                </button>
              )}
            </div>

            <div className="ec-field">
              <label>Course Title *</label>
              <input required value={form.title} onChange={(e) => set("title", e.target.value)} />
            </div>

            <div className="ec-field">
              <label>Short Description <span style={{ fontWeight: 400, color: "#9ca3af", fontSize: 12 }}>{form.short_description.length}/160 — shown on course card</span></label>
              <input
                placeholder="1-2 sentences shown on course card"
                maxLength={160}
                value={form.short_description}
                onChange={(e) => set("short_description", e.target.value)}
              />
            </div>

            <div className="ec-row">
              <div className="ec-field">
                <label>Level</label>
                <select value={form.level} onChange={(e) => set("level", e.target.value)}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="ec-field">
                <label>Price ($)</label>
                <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} />
              </div>
              <div className="ec-field">
                <label>Status</label>
                <input value={course.status} disabled style={{ background: "#f9fafb", color: "#9ca3af" }} />
              </div>
            </div>

            <div className="ec-field">
              <label>Description</label>
              <textarea rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>

            <div className="ec-field">
              <label>Preview Video URL</label>
              <input
                placeholder="https://youtube.com/watch?v=..."
                value={form.preview_video_url}
                onChange={(e) => set("preview_video_url", e.target.value)}
              />
            </div>

            <div className="ec-field">
              <label>What You Will Learn</label>
              <textarea
                rows={4}
                placeholder="List key skills students will gain, one per line"
                value={form.what_you_will_learn}
                onChange={(e) => set("what_you_will_learn", e.target.value)}
              />
            </div>

            <div className="ec-field">
              <label>Requirements</label>
              <textarea
                rows={4}
                placeholder="List prerequisites, one per line"
                value={form.requirements}
                onChange={(e) => set("requirements", e.target.value)}
              />
            </div>

            <div className="ec-row">
              <div className="ec-field">
                <label>Visibility</label>
                <select value={form.visibility} onChange={(e) => set("visibility", e.target.value)}>
                  <option value="public">🌐 Public</option>
                  <option value="private">🔒 Private</option>
                </select>
              </div>
              <div className="ec-field" style={{ justifyContent: "center" }}>
                <label>Certificate</label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 8 }}>
                  <input
                    type="checkbox"
                    checked={form.certificate_enabled}
                    onChange={(e) => setForm((f) => ({ ...f, certificate_enabled: e.target.checked }))}
                  />
                  Enable certificate on completion
                </label>
              </div>
            </div>

            <button type="submit" className="ec-save" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      )}

      {/* Curriculum tab */}
      {tab === "curriculum" && (
        <div className="ec-card">
          <Curriculum courseId={course.id} />
        </div>
      )}
    </div>
  );
}
