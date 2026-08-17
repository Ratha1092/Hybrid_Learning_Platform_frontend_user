import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Star } from "lucide-react";
import { courseService, type CourseDetail, type Section } from "../../services/courseService";
import { reviewService, type Review } from "../../services/reviewService";
import { useAuth } from "../../context/AuthContext";
import { useAuthModal } from "../../context/AuthModalContext";
import EnrollButton from "./EnrollButton";
import "./DetailCourse.css";

function fmtDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}m` : `${m}:${String(s).padStart(2, "0")}`;
}

function toLines(text?: string | null): string[] {
  return (text ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
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

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

function StarRow({ rating, size = 15 }: { rating: number; size?: number }) {
  return (
    <div className="review-stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          width={size}
          height={size}
          className={i <= Math.round(rating) ? "review-star--filled" : "review-star--empty"}
        />
      ))}
    </div>
  );
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="review-star-input">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          className="review-star-input__btn"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          aria-label={`Rate ${i} star${i > 1 ? "s" : ""}`}
        >
          <Star width={26} height={26} className={i <= (hover || value) ? "review-star--filled" : "review-star--empty"} />
        </button>
      ))}
    </div>
  );
}

function ReviewsSection({ courseId, isEnrolled }: { courseId: number; isEnrolled: boolean }) {
  const { user, isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const [searchParams] = useSearchParams();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [myReview, setMyReview] = useState<Review | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    reviewService.getByCourse(courseId, 1)
      .then(({ data }) => {
        const p = data.data;
        setReviews(p.data);
        setLastPage(p.last_page);
        setTotal(p.total);
        setPage(1);
        const mine = user ? p.data.find((r) => r.user_id === user.id) ?? null : null;
        if (mine) {
          setMyReview(mine);
          setRating(mine.rating);
          setTitle(mine.title ?? "");
          setComment(mine.comment ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId, user?.id]);

  useEffect(() => {
    if (searchParams.get("review") === "1" && isAuthenticated && isEnrolled) {
      setShowForm(true);
    }
  }, [searchParams, isAuthenticated, isEnrolled]);

  const loadMore = () => {
    if (page >= lastPage || loadingMore) return;
    setLoadingMore(true);
    reviewService.getByCourse(courseId, page + 1)
      .then(({ data }) => {
        const p = data.data;
        setReviews((prev) => [...prev, ...p.data]);
        setPage(p.current_page);
        setLastPage(p.last_page);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) { setSubmitError("Please select a star rating."); return; }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { data } = await reviewService.create(courseId, {
        rating,
        title: title.trim() || undefined,
        comment: comment.trim() || undefined,
      });
      const saved: Review = {
        ...data.data,
        user: data.data.user ?? (user ? { id: user.id, name: user.name, avatar: user.avatar ?? null } : null),
      };
      setMyReview(saved);
      setReviews((prev) => [saved, ...prev.filter((r) => r.user_id !== saved.user_id)]);
      setTotal((t) => (myReview ? t : t + 1));
      setSubmitMessage(data.message);
      setShowForm(false);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setSubmitError(axiosErr.response?.data?.message ?? "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="detail-section" id="reviews">
      <div className="detail-section__head">
        <h2>Student Reviews</h2>
        {total > 0 && <span className="detail-section__summary">{total} review{total !== 1 ? "s" : ""}</span>}
      </div>

      {submitMessage && <p className="review-submit-msg">{submitMessage}</p>}

      {!isAuthenticated ? (
        <button className="review-cta-btn" onClick={openLogin}>Log in to write a review</button>
      ) : isEnrolled && !showForm ? (
        <button className="review-cta-btn" onClick={() => setShowForm(true)}>
          {myReview ? "Edit your review" : "Write a review"}
        </button>
      ) : null}

      {showForm && (
        <form className="review-form" onSubmit={handleSubmit}>
          <label className="review-form__label">Your rating</label>
          <StarInput value={rating} onChange={setRating} />
          <input
            className="review-form__input"
            placeholder="Title (optional)"
            value={title}
            maxLength={255}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="review-form__textarea"
            placeholder="Share your experience with this course (optional)"
            value={comment}
            maxLength={2000}
            rows={4}
            onChange={(e) => setComment(e.target.value)}
          />
          {submitError && <p className="review-form__error">{submitError}</p>}
          <div className="review-form__actions">
            <button type="button" className="review-form__cancel" onClick={() => setShowForm(false)} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="review-form__submit" disabled={submitting}>
              {submitting ? "Submitting..." : myReview ? "Update review" : "Submit review"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="review-empty">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="review-empty">No reviews yet. Be the first to review this course!</p>
      ) : (
        <div className="review-list">
          {reviews.map((r) => {
            const avatar = resolveUrl(r.user?.avatar ?? null);
            return (
              <div key={r.id} className="review-card">
                <div className="review-card__head">
                  <div className="review-card__avatar">
                    {avatar ? (
                      <img src={avatar} alt={r.user?.name ?? "Student"} />
                    ) : (
                      <span>{(r.user?.name ?? "?").charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="review-card__who">
                    <p className="review-card__name">{r.user?.name ?? "Student"}</p>
                    <p className="review-card__date">{timeAgo(r.created_at)}</p>
                  </div>
                  <StarRow rating={r.rating} />
                </div>
                {r.title && <p className="review-card__title">{r.title}</p>}
                {r.comment && <p className="review-card__comment">{r.comment}</p>}
                {!r.is_approved && r.user_id === user?.id && (
                  <p className="review-card__pending">Awaiting moderation — only visible to you</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {page < lastPage && (
        <button className="review-load-more" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? "Loading..." : "Load more reviews"}
        </button>
      )}
    </section>
  );
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
          <div className="detail-badges">
            <span className="detail-badge">{course.level}</span>
            {course.category?.name && (
              <span className="detail-badge detail-badge--category">{course.category.name}</span>
            )}
          </div>
          <h1 className="detail-title">{course.title}</h1>
          <p className="detail-short-desc">{course.short_description}</p>
          <div className="detail-meta">
            {course.average_rating != null && (
              <span className="detail-meta__item detail-meta__item--rating">
                <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                {course.average_rating.toFixed(1)}
                {course.reviews_count != null && course.reviews_count > 0 && (
                  <span style={{ opacity: 0.75, fontWeight: 500 }}>({course.reviews_count})</span>
                )}
              </span>
            )}
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
            {course.preview_video_url && (
              <a
                href={course.preview_video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="detail-meta__item detail-copy-btn"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Watch preview
              </a>
            )}
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

          {/* What you'll learn */}
          {toLines(course.what_you_will_learn).length > 0 && (
            <section className="detail-section">
              <h2>What You'll Learn</h2>
              <ul className="detail-check-list">
                {toLines(course.what_you_will_learn).map((line, i) => (
                  <li key={i}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Requirements */}
          {toLines(course.requirements).length > 0 && (
            <section className="detail-section">
              <h2>Requirements</h2>
              <ul className="detail-check-list detail-check-list--dot">
                {toLines(course.requirements).map((line, i) => (
                  <li key={i}>
                    <span className="detail-check-list__dot" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

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

          {/* Reviews */}
          <ReviewsSection courseId={course.id} isEnrolled={!!course.is_enrolled} />
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
            {course.category?.name && (
              <li><span>Category</span><strong>{course.category.name}</strong></li>
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
