import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { instructorService, type InstructorCourse } from "../../../../services/instructorService";
import "../css/MyCourses.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
function resolveUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

const STATUS_COLORS: Record<string, string> = {
  published: "#22c55e",
  draft: "#9ca3af",
  pending: "#f59e0b",
  rejected: "#ef4444",
};

export default function MyCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopyLink = async (course: InstructorCourse) => {
    const slug = course.slug ?? course.id;
    const url = `${window.location.origin}/courses/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(course.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* silent — clipboard may be unavailable */ }
  };

  const load = () => {
    setLoading(true);
    instructorService.getMyCourses()
      .then(({ data }) => setCourses(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this course? This cannot be undone.")) return;
    try {
      await instructorService.deleteCourse(id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch { /* silent */ }
  };

  const handleSubmit = async (id: number) => {
    if (submittingId !== null) return;
    setSubmittingId(id);
    setSubmitError(null);
    try {
      await instructorService.submitForReview(id);
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setSubmitError(e.response?.data?.message ?? "Failed to submit. Make sure your course has at least one section and lesson.");
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mc-loading">
        <div className="mc-spinner" />
      </div>
    );
  }

  return (
    <div className="mc-page">
      <div className="mc-header">
        <h1 className="mc-title">My Courses</h1>
        <button className="mc-btn-create" onClick={() => navigate("/instructor/courses/create")}>
          + Create Course
        </button>
      </div>

      {submitError && (
        <div className="mc-error">⚠ {submitError}</div>
      )}

      {courses.length === 0 ? (
        <div className="mc-empty">
          <span>🎓</span>
          <p>No courses yet. Create your first course!</p>
        </div>
      ) : (
        <div className="mc-list">
          {courses.map((course) => (
            <div key={course.id} className="mc-row">
              <div className="mc-row__thumb">
                {resolveUrl(course.thumbnail_url) ? (
                  <img
                    src={resolveUrl(course.thumbnail_url)!}
                    alt={course.title}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling?.removeAttribute("style");
                    }}
                  />
                ) : null}
                <div className="mc-row__thumb-placeholder" style={resolveUrl(course.thumbnail_url) ? { display: "none" } : undefined}>🎓</div>
              </div>

              <div className="mc-row__info">
                <p className="mc-row__title">{course.title}</p>
                <div className="mc-row__meta">
                  <span className="mc-badge" style={{ color: STATUS_COLORS[course.status] ?? "#9ca3af", background: `${STATUS_COLORS[course.status]}18` }}>
                    {course.status}
                  </span>
                  <span className="mc-row__level">{course.level}</span>
                  <span className="mc-row__price">
                    {Number(course.price) === 0 ? "Free" : `$${course.price}`}
                  </span>
                  <span className="mc-row__students">👥 {course.students_count ?? 0}</span>
                </div>
              </div>

              <div className="mc-row__actions">
                <button
                  className={`mc-btn mc-btn--copy${copiedId === course.id ? " mc-btn--copied" : ""}`}
                  onClick={() => handleCopyLink(course)}
                  title="Copy shareable link"
                >
                  {copiedId === course.id ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                      Copy Link
                    </>
                  )}
                </button>
                <button
                  className="mc-btn mc-btn--edit"
                  onClick={() => navigate(`/instructor/courses/${course.id}/edit`)}
                >
                  Edit
                </button>
                {course.status === "draft" && (
                  <button
                    className="mc-btn mc-btn--submit"
                    onClick={() => handleSubmit(course.id)}
                    disabled={submittingId === course.id}
                    style={submittingId === course.id ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
                  >
                    {submittingId === course.id ? "Submitting..." : "Submit"}
                  </button>
                )}
                <button
                  className="mc-btn mc-btn--delete"
                  onClick={() => handleDelete(course.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
