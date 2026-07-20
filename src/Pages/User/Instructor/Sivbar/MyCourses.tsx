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
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    instructorService.getMyCourses()
      .then(({ data }) => setCourses(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    setConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!confirmId) return;
    const id = confirmId;
    setConfirmId(null);
    try {
      await instructorService.deleteCourse(id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch { /* silent */ }
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
                  className="mc-btn mc-btn--edit"
                  onClick={() => navigate(`/instructor/courses/${course.id}/edit`)}
                >
                  Edit
                </button>

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

      {/* Delete */}
      {confirmId !== null && (
        <div className="mc-modal-backdrop" onClick={() => setConfirmId(null)}>
          <div className="mc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mc-modal__icon">🗑️</div>
            <h3 className="mc-modal__title">Delete this course?</h3>
            <p className="mc-modal__body">This action cannot be undone. The course and all its content will be permanently removed.</p>
            <div className="mc-modal__actions">
              <button className="mc-modal__cancel" onClick={() => setConfirmId(null)}>Cancel</button>
              <button className="mc-modal__confirm" onClick={confirmDelete}>Yes, delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
