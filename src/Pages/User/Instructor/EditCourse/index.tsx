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
  const [form, setForm] = useState({ title: "", description: "", price: "0", level: "beginner" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    instructorService.getCourseById(id)
      .then(({ data }) => {
        const c = data.data;
        setCourse(c);
        setForm({
          title: c.title,
          description: c.description ?? "",
          price: c.price,
          level: c.level,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const { data } = await instructorService.updateCourse(id, form);
      setCourse(data.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string };
      const msg = e.response?.data?.errors ? Object.values(e.response.data.errors).flat().join(" ") : e.response?.data?.message ?? e.message ?? "Failed to save.";
      setError(msg);
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
              <label>Course Title *</label>
              <input required value={form.title} onChange={(e) => set("title", e.target.value)} />
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
