import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { courseService, type CourseDetail, type Section } from "../../services/courseService";
import EnrollButton from "./EnrollButton";
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
        <span className="accordion__chevron">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>
        </span>
      </button>

      {open && (
        <ul className="accordion__lessons">
          {section.lessons.map((lesson) => (
            <li key={lesson.id} className="lesson-row">
              <span className="lesson-row__icon">
                {lesson.type === "video" ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                )}
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

const API_BASE = import.meta.env.VITE_API_URL ?? "";
function resolveUrl(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

function DetailCourse() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0]));
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  };

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
          <img src={resolveUrl(course.thumbnail_url)!} alt={course.title} className="detail-hero__img" />
        ) : (
          <div className={`detail-hero__placeholder detail-hero__placeholder--${course.level}`} />
        )}
        <div className="detail-hero__overlay" />
        <button className="detail-back" onClick={() => navigate(-1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          Back
        </button>
        <div className="detail-hero__content">
          <span className="detail-badge">{course.level}</span>
          <h1 className="detail-title">{course.title}</h1>
          <p className="detail-short-desc">{course.short_description}</p>
          <div className="detail-meta">
            {course.instructor?.name && (
              <span className="detail-meta__item detail-meta__item--instructor">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                {course.instructor.name}
              </span>
            )}
            {course.language && (
              <span className="detail-meta__item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                {course.language}
              </span>
            )}
            <span className="detail-meta__item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"/></svg>
              {course.sections?.length ?? 0} sections
            </span>
            <span className="detail-meta__item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/></svg>
              {totalLessons} lessons
            </span>
            <span className="detail-meta__item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {fmtDuration(totalDuration)}
            </span>
            <button
              className={`detail-meta__item detail-copy-btn${copied ? " detail-copy-btn--copied" : ""}`}
              onClick={handleCopyLink}
              title="Copy course link"
            >
              {copied ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  Share
                </>
              )}
            </button>
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
          <EnrollButton course={course} />
          <ul className="detail-card__info">
            {course.instructor?.name && (
              <li><span>Instructor</span><strong>{course.instructor.name}</strong></li>
            )}
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
