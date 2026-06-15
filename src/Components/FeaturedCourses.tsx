import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, Clock, Star, Users } from "lucide-react";

import { courseService, type Course } from "../services/courseService";
import "./FeaturedCourses.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
const SKELETON_COUNT = 6;
const TAG_PALETTE = [
  "#ff6b35", "#00bfa5", "#8bc34a", "#9c27b0",
  "#ff5722", "#2196f3", "#e91e63", "#ff9800",
];

function resolveUrl(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

function tagColor(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_PALETTE[Math.abs(hash) % TAG_PALETTE.length];
}

function formatPrice(price: string): string {
  return Number(price) === 0 ? "Free" : `$${price}`;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={12}
          fill={star <= Math.round(rating) ? "#ffc107" : "none"}
          stroke={star <= Math.round(rating) ? "#ffc107" : "#c7c7cc"}
        />
      ))}
    </span>
  );
}

function CourseImage({ url, title }: { url: string | null; title: string }) {
  const [err, setErr] = useState(false);
  const src = resolveUrl(url);
  if (src && !err) {
    return <img src={src} alt={title} onError={() => setErr(true)} />;
  }
  return (
    <div className="course-thumb__fallback">
      <span>🎓</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="course-card course-card--skeleton">
      <div className="sk sk--thumb" />
      <div className="course-body">
        <div className="sk sk--line sk--sm" />
        <div className="sk sk--line sk--lg" style={{ marginTop: 8 }} />
        <div className="sk sk--line sk--md" />
        <div className="sk sk--line sk--sm" style={{ marginTop: 10 }} />
      </div>
    </div>
  );
}

function FeaturedCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    courseService
      .getAll()
      .then(({ data }) => {
        if (!cancelled) {
          setCourses((data.data as unknown as Course[]) ?? []);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError((err as { message?: string }).message ?? "Failed to load courses.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="section courses-section">
      <div className="container">

        {/* ── Header ── */}
        <div className="section-header">
          <div>
             <h2 className="section-title">Featured Courses</h2>
            <p className="section-sub">Explore our Popular Courses</p>
         </div>
          <button className="btn btn-outline" onClick={() => navigate("/courses")}>
            All Courses <ChevronRight size={16} />
          </button>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="courses-error">
            <span>⚠ {error}</span>
          </div>
        )}

        {/* ── Grid ── */}
        <div className="courses-grid">
          {loading ? (
            Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <SkeletonCard key={i} />
            ))
          ) : courses.length === 0 ? (
            <div className="courses-empty">
              <span>📚</span>
              <p>No courses available</p>
            </div>
          ) : (
            courses.slice(0, 6).map((course) => (
              <div
                className="course-card"
                key={course.id}
                onClick={() => navigate(`/courses/${course.slug ?? course.id}`)}
              >
                <div className="course-thumb">
                  <CourseImage url={course.thumbnail_url} title={course.title} />
                  <span
                    className="course-tag"
                    style={{ background: tagColor(course.level ??  "Beginner" ) }}
                  >
                    {course.level}
                  </span>
                </div>
 
                <div className="course-body">
                  <div className="course-instructor">
                    <BookOpen size={16} />  
                     {course.language ?? ""}
                  </div>

                  <h3 className="course-title">{course.title}</h3>

                  <div className="course-meta">
                    <span>
                      <Clock size={12} /> {course.duration ?? 0} Mn
                    </span>
                    <span>
                      <Users size={12} /> {course.students_count ?? 0}+ Students
                    </span>
                  </div>

                  <div className="course-footer">
                    <div className="course-rating">
                      <StarRating rating={4.5} />
                      <span className="rating-count">({course.likes_count ?? 0})</span>
                    </div>
                    <div className="course-bottom">
                      <span
                        className={`course-price${Number(course.price) === 0 ? " free" : ""}`}
                      >
                        {formatPrice(course.price)}
                      </span>
                      <button
                        className="view-more-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/courses/${course.slug ?? course.id}`);
                        }}
                      >
                        View More
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </section>
  );
}

export default FeaturedCourses;
