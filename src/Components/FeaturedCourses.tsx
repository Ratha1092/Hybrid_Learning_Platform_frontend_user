import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { courseService, type Course } from "../services/courseService";
const API_BASE = import.meta.env.VITE_API_URL ?? "";
function resolveUrl(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

function CourseThumb({ url, title, level }: { url: string | null; title: string; level: string }) {
  const [err, setErr] = useState(false);
  const src = resolveUrl(url);
  return (
    <div className="fc-thumb">
      {src && !err ? (
        <img src={src} alt={title} onError={() => setErr(true)} />
      ) : (
        <div className="fc-thumb__placeholder">🎓</div>
      )}
      <span className="fc-badge">{level}</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="fc-card fc-card--skeleton">
      <div className="fc-skel fc-skel--thumb" />
      <div className="fc-card__body">
        <div className="fc-skel fc-skel--line fc-skel--sm" />
        <div className="fc-skel fc-skel--line fc-skel--lg" />
        <div className="fc-skel fc-skel--line fc-skel--md" />
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
        <div className="fc-header">
          <div>
            <h2 className="fc-title">Featured Courses</h2>
            <p className="fc-sub">Explore our Popular Courses</p>
          </div>
          <button className="fc-all-btn" onClick={() => navigate("/courses")}>
            All Courses →
          </button>
        </div>

        <div className="fc-grid">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : courses.map((course) => (
                <div
                  key={course.id}
                  className="fc-card"
                  onClick={() => navigate(`/courses/${course.slug ?? course.id}`)}
                >
                  <CourseThumb url={course.thumbnail_url} title={course.title} level={course.level} />
                  <div className="fc-card__body">
                    <p className="fc-card__lang">{course.language}</p>
                    <h3 className="fc-card__title">{course.title}</h3>
                    <p className="fc-card__desc">{course.short_description}</p>
                    <div className="fc-card__footer">
                      <div className="fc-card__stats">
                        <span>👥 {course.students_count ?? 0}</span>
                        <span>⭐ {course.reviews_count ?? 0}</span>
                      </div>
                      <span className={`fc-card__price${Number(course.price) === 0 ? " fc-card__price--free" : ""}`}>
                        {Number(course.price) === 0 ? "Free" : `$${course.price}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
