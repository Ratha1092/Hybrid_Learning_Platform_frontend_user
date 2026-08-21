import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { classifyVideoUrl, buildYouTubeEmbed, buildVimeoEmbed } from "../../utils/videoUrl";
import "./Learn.css";

// Fraction of the video that must actually be played (not just seeked past)
// before a lesson auto-completes.
const AUTO_COMPLETE_THRESHOLD = 0.9;
// How often we persist the resume position while playing.
const RESUME_SAVE_INTERVAL_MS = 5000;
const resumeKey = (lessonId: number) => `learn:resume:${lessonId}`;

// video.played gives the ranges of currentTime the user has actually played
// through (seeking ahead leaves a gap), so summing it — rather than trusting
// the furthest currentTime reached — stops "drag to the end" from counting
// as watched.
function playedCoverage(video: HTMLVideoElement): number {
  if (!video.duration) return 0;
  let covered = 0;
  const ranges = video.played;
  for (let i = 0; i < ranges.length; i++) covered += ranges.end(i) - ranges.start(i);
  return covered / video.duration;
}

interface LessonAttachment {
  id: number;
  title: string;
  type: string;
  file_url: string;
}

interface LessonItem {
  id: number;
  title: string;
  type: string;
  duration: number;
  is_preview: boolean;
  order: number;
  video_url?: string;
  content?: string;
  description?: string;
  attachments?: LessonAttachment[];
}

interface SectionItem {
  id: number;
  title: string;
  order: number;
  lessons: LessonItem[];
}

interface CourseData {
  id: number;
  title: string;
  slug: string;
  sections: SectionItem[];
  access_expired?: boolean;
  access_expires_at?: string | null;
}

export default function Learn() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [activeLesson, setActiveLesson] = useState<LessonItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0]));
  const [completeError, setCompleteError] = useState<string | null>(null);
  const lastResumeSaveRef = useRef(0);
  const autoCompletingRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!slug) return;

    api.get<{ data: CourseData }>(`/courses/${slug}`)
      .then(async ({ data }) => {
        const courseData = data.data;
        setCourse(courseData);
        const first = courseData.sections?.[0]?.lessons?.[0];
        if (first) setActiveLesson(first);

        // Load saved progress for all lessons in parallel
        const allLessons = courseData.sections?.flatMap(s => s.lessons) ?? [];
        const results = await Promise.allSettled(
          allLessons.map(l => api.get<{ data: { is_completed: boolean } }>(`/lessons/${l.id}/progress`))
        );
        const done = new Set<number>();
        results.forEach((r, i) => {
          if (r.status === "fulfilled" && r.value.data.data?.is_completed) {
            done.add(allLessons[i].id);
          }
        });
        setCompletedIds(done);
      })
      .catch(() => setError("Failed to load course."))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  const handleSelectLesson = (lesson: LessonItem) => {
    setActiveLesson(lesson);
    setCompleteError(null);
  };

  const handleComplete = async (lessonId: number) => {
    // Optimistic update — mark immediately so the UI responds
    setCompletedIds((prev) => new Set([...prev, lessonId]));
    setCompleteError(null);
    try {
      await api.post(`/lessons/${lessonId}/progress`, {
        is_completed: true,
      });
      localStorage.removeItem(resumeKey(lessonId));
    } catch {
      // Roll back and show error
      setCompletedIds((prev) => { const next = new Set(prev); next.delete(lessonId); return next; });
      setCompleteError("Could not save progress. Please try again.");
    } finally {
      autoCompletingRef.current.delete(lessonId);
    }
  };

  // Called on every timeupdate tick of a direct-hosted <video>. Persists a
  // resume position (throttled) and auto-completes once actual watched
  // coverage — not just how far the scrubber was dragged — crosses the
  // threshold.
  const handleVideoProgress = (lessonId: number, video: HTMLVideoElement) => {
    const now = Date.now();
    if (now - lastResumeSaveRef.current > RESUME_SAVE_INTERVAL_MS) {
      lastResumeSaveRef.current = now;
      if (!completedIds.has(lessonId)) {
        localStorage.setItem(resumeKey(lessonId), String(video.currentTime));
      }
    }

    if (completedIds.has(lessonId) || autoCompletingRef.current.has(lessonId)) return;
    if (playedCoverage(video) >= AUTO_COMPLETE_THRESHOLD) {
      autoCompletingRef.current.add(lessonId);
      handleComplete(lessonId);
    }
  };

  const handleVideoEnded = (lessonId: number) => {
    if (completedIds.has(lessonId) || autoCompletingRef.current.has(lessonId)) return;
    autoCompletingRef.current.add(lessonId);
    handleComplete(lessonId);
  };

  const handleVideoLoadedMetadata = (lessonId: number, video: HTMLVideoElement) => {
    const saved = Number(localStorage.getItem(resumeKey(lessonId)));
    if (saved > 0 && saved < video.duration - 5) {
      video.currentTime = saved;
    }
  };

  const toggleSection = (i: number) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const totalLessons = course?.sections?.reduce((s, sec) => s + sec.lessons.length, 0) ?? 0;
  const completionPct = totalLessons > 0 ? Math.round((completedIds.size / totalLessons) * 100) : 0;

  const allLessonsFlat = course?.sections?.flatMap((s) => s.lessons) ?? [];
  const activeIndex = activeLesson ? allLessonsFlat.findIndex((l) => l.id === activeLesson.id) : -1;
  const prevLesson = activeIndex > 0 ? allLessonsFlat[activeIndex - 1] : null;
  const nextLesson = activeIndex >= 0 && activeIndex < allLessonsFlat.length - 1 ? allLessonsFlat[activeIndex + 1] : null;

  if (loading) {
    return (
      <div className="learn-state">
        <div className="learn-spinner" />
        <p>Loading course...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="learn-state learn-state--error">
        <p>⚠ {error ?? "Course not found."}</p>
        <button onClick={() => navigate("/courses")}>← Back to Courses</button>
      </div>
    );
  }

  return (
    <div className="learn-wrap">
      {/* ── Sidebar ── */}
      <aside className="learn-sidebar">
        <div className="learn-sidebar__head">
          <button className="learn-back" onClick={() => navigate("/courses")}>← Exit</button>
          <h3 className="learn-sidebar__title">{course.title}</h3>
          <p className="learn-sidebar__progress">
            {completedIds.size} / {totalLessons} lessons · {completionPct}% complete
          </p>
          <div className="learn-progressbar">
            <div
              className="learn-progressbar__fill"
              style={{ width: totalLessons > 0 ? `${(completedIds.size / totalLessons) * 100}%` : "0%" }}
            />
          </div>
        </div>

        <div className="learn-sections">
          {course.sections?.map((section, si) => (
            <div key={section.id} className="learn-section">
              <button
                className="learn-section__head"
                onClick={() => toggleSection(si)}
              >
                <span className="learn-section__chevron">{openSections.has(si) ? "▼" : "▶"}</span>
                <span className="learn-section__title">{section.title}</span>
                <span className="learn-section__count">{section.lessons.length}</span>
              </button>

              {openSections.has(si) && (
                <div className="learn-lessons">
                  {section.lessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      className={`learn-lesson${activeLesson?.id === lesson.id ? " learn-lesson--active" : ""}${completedIds.has(lesson.id) ? " learn-lesson--done" : ""}`}
                      onClick={() => handleSelectLesson(lesson)}
                    >
                      <span className="learn-lesson__icon">
                        {completedIds.has(lesson.id) ? "✓" : lesson.type === "video" ? "▶" : "📄"}
                      </span>
                      <span className="learn-lesson__title">{lesson.title}</span>
                      {lesson.duration > 0 && (
                        <span className="learn-lesson__dur">
                          {Math.floor(lesson.duration / 60)}m
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="learn-main">
        {course.access_expired && (
          <div className="learn-expired-banner">
            <span>⏳ Your access to this course has expired.</span>
            <button onClick={() => navigate(`/courses/${course.slug}`)}>Renew Access</button>
          </div>
        )}
        {activeLesson ? (
          <>
            {/* Video */}
            {activeLesson.type === "video" && (
              <div className="learn-video-wrap">
                {(() => {
                  const kind = classifyVideoUrl(activeLesson.video_url);
                  if (kind === "youtube") return (
                    <iframe
                      src={buildYouTubeEmbed(activeLesson.video_url!)}
                      title={activeLesson.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="learn-video"
                    />
                  );
                  if (kind === "vimeo") return (
                    <iframe
                      src={buildVimeoEmbed(activeLesson.video_url!)}
                      title={activeLesson.title}
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      className="learn-video"
                    />
                  );
                  if (kind === "direct") return (
                    <video
                      src={activeLesson.video_url!}
                      controls
                      controlsList="nodownload"
                      onContextMenu={(e) => e.preventDefault()}
                      onLoadedMetadata={(e) => handleVideoLoadedMetadata(activeLesson.id, e.currentTarget)}
                      onTimeUpdate={(e) => handleVideoProgress(activeLesson.id, e.currentTarget)}
                      onEnded={() => handleVideoEnded(activeLesson.id)}
                      className="learn-video"
                      style={{ background: "#000" }}
                    />
                  );
                  if (activeLesson.video_url) return (
                    <div className="learn-no-video">
                      <span>🚫</span>
                      <p>Invalid video URL.</p>
                    </div>
                  );
                  if (course.access_expired && !activeLesson.is_preview) return (
                    <div className="learn-no-video">
                      <span>⏳</span>
                      <p>Your access has expired. Renew to keep watching.</p>
                    </div>
                  );
                  return (
                    <div className="learn-no-video">
                      <span>🎬</span>
                      <p>No video URL provided for this lesson.</p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Article */}
            {activeLesson.type === "article" && (
              <div className="learn-article">
                {activeLesson.content ? (
                  <div className="learn-content">{activeLesson.content}</div>
                ) : (
                  <p className="learn-empty">No content provided for this lesson.</p>
                )}
              </div>
            )}

            {/* Lesson info */}
            <div className="learn-lesson-info">
              <div className="learn-lesson-info__main">
                <h2 className="learn-lesson-title">{activeLesson.title}</h2>
                <div className="learn-lesson-meta">
                  <span className="learn-lesson-type">{activeLesson.type}</span>
                  {activeLesson.duration > 0 && (
                    <span className="learn-lesson-dur">{Math.floor(activeLesson.duration / 60)}m</span>
                  )}
                </div>
                {activeLesson.description && (
                  <p className="learn-lesson-desc">{activeLesson.description}</p>
                )}
              </div>
              <div className="learn-complete-wrap">
                {completeError && <span className="learn-complete-error">{completeError}</span>}
                {!completedIds.has(activeLesson.id) ? (
                  <button
                    className="learn-complete-btn"
                    onClick={() => handleComplete(activeLesson.id)}
                  >
                    ✓ Mark as Complete
                  </button>
                ) : (
                  <span className="learn-completed-badge">✓ Completed</span>
                )}
              </div>
            </div>

            {/* Resources */}
            {!!activeLesson.attachments?.length && (
              <div className="learn-resources">
                <h3 className="learn-resources__title">Resources</h3>
                <ul className="learn-resources__list">
                  {activeLesson.attachments.map((r) => (
                    <li key={r.id} className="learn-resource">
                      <span className="learn-resource__icon">📎</span>
                      <span className="learn-resource__title">{r.title}</span>
                      <span className="learn-resource__type">{r.type}</span>
                      <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="learn-resource__download">
                        Download
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Previous / Next lesson navigation */}
            <div className="learn-nav-bar">
              <button
                className="learn-nav-btn"
                disabled={!prevLesson}
                onClick={() => prevLesson && handleSelectLesson(prevLesson)}
              >
                ← Previous
              </button>
              <button
                className="learn-nav-btn learn-nav-btn--next"
                disabled={!nextLesson}
                onClick={() => nextLesson && handleSelectLesson(nextLesson)}
              >
                Next →
              </button>
            </div>
          </>
        ) : (
          <div className="learn-state">
            <p>Select a lesson from the sidebar to start learning.</p>
          </div>
        )}
      </main>
    </div>
  );
}
