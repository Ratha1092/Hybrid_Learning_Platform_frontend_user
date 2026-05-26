import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { courseService, type CourseDetail, type Section } from "../../services/courseService";
import "./DetailCourse.css";

function fmtDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}m` : `${m}:${String(s).padStart(2, "0")}`;
}

function sectionTotalDuration(section: Section) {
  return section.lessons.reduce((sum, l) => sum + l.duration, 0);
}

function SectionAccordion({ section, index, open, onToggle }: {
  section: Section;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  const total = sectionTotalDuration(section);
  return (
    <div className={`accordion${open ? " accordion--open" : ""}`}>
      <button className="accordion__header" onClick={onToggle}>
        <div className="accordion__left">
          <span className="accordion__index">{index + 1}</span>
          <div>
            <p className="accordion__title">{section.title}</p>
            <p className="accordion__meta">
              {section.lessons.length} lessons · {fmtDuration(total)}
            </p>
          </div>
        </div>
        <span className="accordion__chevron">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <ul className="accordion__lessons">
          {section.lessons.map((lesson) => (
            <li key={lesson.id} className="lesson-row">
              <span className="lesson-row__icon">
                {lesson.type === "video" ? "▶" : "📄"}
              </span>
              <span className="lesson-row__title">{lesson.title}</span>
              <div className="lesson-row__right">
                {lesson.is_preview && (
                  <span className="lesson-row__preview">Preview</span>
                )}
                <span className="lesson-row__dur">{fmtDuration(lesson.duration)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DetailCourse() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    courseService.getBySlug(slug)
      .then(({ data }) => setCourse(data.data))
      .catch((err: unknown) =>
        setError((err as { message?: string }).message ?? "Failed to load course.")
      )
      .finally(() => setLoading(false));
  }, [slug]);

  const toggleSection = (i: number) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="detail-state">
        <div className="detail-spinner" />
        <p>Loading course...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-state detail-state--error">
        <p>⚠ {error}</p>
        <button onClick={() => navigate(-1)}>← Go Back</button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="detail-state">
        <p>Course not found.</p>
        <button onClick={() => navigate(-1)}>← Go Back</button>
      </div>
    );
  }

  const totalLessons = course.sections?.reduce((s, sec) => s + sec.lessons.length, 0) ?? 0;
  const totalDuration = course.sections?.reduce((s, sec) => s + sectionTotalDuration(sec), 0) ?? 0;

  return (
    <div className="detail-page">
      {/* ── Hero ── */}
      <div className="detail-hero">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="detail-hero__img" />
        ) : (
          <div className={`detail-hero__placeholder detail-hero__placeholder--${course.level}`} />
        )}
        <div className="detail-hero__overlay" />
        <div className="detail-hero__content">
          <button className="detail-back" onClick={() => navigate(-1)}>← Back</button>
          <span className="detail-badge">{course.level}</span>
          <h1 className="detail-title">{course.title}</h1>
          <p className="detail-short-desc">{course.short_description}</p>
          <div className="detail-meta">
            {course.language && <span>🌐 {course.language}</span>}
            <span>📚 {course.sections?.length ?? 0} sections</span>
            <span>🎬 {totalLessons} lessons</span>
            <span>⏱ {fmtDuration(totalDuration)}</span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="detail-body">
        {/* ── Left ── */}
        <div className="detail-main">
          {/* Description */}
          <section className="detail-section">
            <h2>About This Course</h2>
            <p>{course.description || course.short_description}</p>
          </section>

          {/* Sections accordion */}
          {course.sections && course.sections.length > 0 && (
            <section className="detail-section">
              <div className="detail-section__head">
                <h2>Course Content</h2>
                <span className="detail-section__summary">
                  {course.sections.length} sections · {totalLessons} lessons · {fmtDuration(totalDuration)}
                </span>
              </div>

              <div className="accordion-list">
                {course.sections
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((section, i) => (
                    <SectionAccordion
                      key={section.id}
                      section={section}
                      index={i}
                      open={openSections.has(i)}
                      onToggle={() => toggleSection(i)}
                    />
                  ))}
              </div>
            </section>
          )}
        </div>

        {/* ── Right: Enroll card ── */}
        <aside className="detail-card">
          <div className="detail-card__price">
            {Number(course.price) === 0 ? (
              <span className="detail-card__price--free">Free</span>
            ) : (
              `$${course.price}`
            )}
          </div>
          <button className="detail-enroll-btn">Enroll Now</button>
          <ul className="detail-card__info">
            <li><span>Level</span><strong>{course.level}</strong></li>
            {course.language && <li><span>Language</span><strong>{course.language}</strong></li>}
            <li><span>Sections</span><strong>{course.sections?.length ?? 0}</strong></li>
            <li><span>Lessons</span><strong>{totalLessons}</strong></li>
            <li><span>Duration</span><strong>{fmtDuration(totalDuration)}</strong></li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

export default DetailCourse;
