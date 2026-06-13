import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { courseService, type Course } from "../services/courseService";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
function resolveUrl(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

function CourseThumb({ url, title, level, children }: { url: string | null; title: string; level: string; children?: React.ReactNode }) {
  const [err, setErr] = useState(false);
  const src = resolveUrl(url);
  return (
    <div className={`course-card__thumb course-card__thumb--${level.toLowerCase()}`}>
      {src && !err ? (
        <img src={src} alt={title} onError={() => setErr(true)} />
      ) : (
        <div className="course-card__thumb-placeholder">
          <span className="course-card__thumb-icon">🎓</span>
        </div>
      )}
      {children}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="course-card course-card--skeleton">
      <div className="skeleton skeleton--thumb" />
      <div className="course-card__body">
        <div className="skeleton skeleton--line skeleton--sm" />
        <div className="skeleton skeleton--line skeleton--lg" style={{ marginTop: 8 }} />
        <div className="skeleton skeleton--line skeleton--md" />
        <div className="skeleton skeleton--line skeleton--sm" style={{ marginTop: 12 }} />
      </div>
    </div>
  );
}

export default function FeaturedCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courseService.getAll()
      .then(({ data }) => {
        const list = (data.data as unknown as Course[]) ?? [];
        setCourses(list.slice(0, 8));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="fc-section">
      <div className="fc-container">
        {/* Header */}
        <div className="fc-header">
          <div>
            <h2 className="fc-title">Featured Courses</h2>
            <p className="fc-sub">Explore our Popular Courses</p>
          </div>
          <button className="fc-all-btn" onClick={() => navigate("/courses")}>
            All Courses →
          </button>
        </div>

        {/* Grid — fc-grid for 4-col layout, course-card classes for card style */}
        <div className="fc-grid">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : courses.map((course) => (
              <div
                key={course.id}
                className="course-card"
                onClick={() => navigate(`/courses/${course.slug ?? course.id}`)}
              >
                <CourseThumb url={course.thumbnail_url} title={course.title} level={course.level}>
                  <span className={`course-card__badge${Number(course.price) === 0 ? " course-card__badge--free" : ""}`}>
                    {Number(course.price) === 0 ? "Free" : `$${course.price}`}
                  </span>
                </CourseThumb>

                <div className="course-card__body">
                  <div className="course-card__provider">
                    <div className="course-card__avatar">
                      {course.instructor?.name ? course.instructor.name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <span className="course-card__category">
                      {course.instructor?.name ?? course.language}
                    </span>
                  </div>

                  <h3 className="course-card__title">{course.title}</h3>
                  <p className="course-card__desc">{course.short_description}</p>

                  <div className="course-card__stats">
                    <span className="course-card__stat">
                      <span className="stat-icon">👥</span>
                      {course.students_count ?? 0}
                    </span>
                    <span className="course-card__stat-sep">·</span>
                    <span className="course-card__stat">
                      <span className="stat-icon">⭐</span>
                      {course.reviews_count ?? 0}
                    </span>
                  </div>

                  <div className="course-card__footer">
                    <button
                      className="course-card__view-btn"
                      onClick={(e) => { e.stopPropagation(); navigate(`/courses/${course.slug ?? course.id}`); }}
                    >
                      View More
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>

      </div>
    </section>
  );
}
