import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { classifyVideoUrl } from "../../utils/videoUrl";
import { useLanguage } from "../../context/LanguageContext";
import "./Learn.css";

function buildYouTubeEmbed(url: string): string {
  return url.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/");
}

function buildVimeoEmbed(url: string): string {
  return url.replace("vimeo.com/", "player.vimeo.com/video/");
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
  const { t } = useLanguage();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [activeLesson, setActiveLesson] = useState<LessonItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0]));
  const [completeError, setCompleteError] = useState<string | null>(null);

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
      .catch(() => setError(t("learnPage.loadCourseFailed")))
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
    } catch {
      // Roll back and show error
      setCompletedIds((prev) => { const next = new Set(prev); next.delete(lessonId); return next; });
      setCompleteError(t("learnPage.saveProgressFailed"));
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

  if (loading) {
    return (
      <div className="learn-state">
        <div className="learn-spinner" />
        <p>{t("learnPage.loading")}</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="learn-state learn-state--error">
        <p>⚠ {error ?? t("learnPage.courseNotFound")}</p>
        <button onClick={() => navigate("/courses")}>{t("learnPage.backToCourses")}</button>
      </div>
    );
  }

  return (
    <div className="learn-wrap">
      {/* ── Sidebar ── */}
      <aside className="learn-sidebar">
        <div className="learn-sidebar__head">
          <button className="learn-back" onClick={() => navigate("/courses")}>{t("learnPage.exit")}</button>
          <h3 className="learn-sidebar__title">{course.title}</h3>
          <p className="learn-sidebar__progress">
            {completedIds.size} / {totalLessons} {t("learnPage.lessonsSuffix")}
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
                        {completedIds.has(lesson.id) ? "✓" : lesson.type === "video" ? "▶" : lesson.type === "quiz" ? "📝" : "📄"}
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
            <span>{t("learnPage.accessExpiredBanner")}</span>
            <button onClick={() => navigate(`/courses/${course.slug}`)}>{t("learnPage.renewAccess")}</button>
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
                      className="learn-video"
                      style={{ background: "#000" }}
                    />
                  );
                  if (activeLesson.video_url) return (
                    <div className="learn-no-video">
                      <span>🚫</span>
                      <p>{t("learnPage.invalidVideoUrl")}</p>
                    </div>
                  );
                  if (course.access_expired && !activeLesson.is_preview) return (
                    <div className="learn-no-video">
                      <span>⏳</span>
                      <p>{t("learnPage.accessExpiredRenew")}</p>
                    </div>
                  );
                  return (
                    <div className="learn-no-video">
                      <span>🎬</span>
                      <p>{t("learnPage.noVideoUrl")}</p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Article */}
            {activeLesson.type === "article" && (
              <div className="learn-article">
                {activeLesson.content ? (
                  <p>{activeLesson.content}</p>
                ) : (
                  <p className="learn-empty">{t("learnPage.noContent")}</p>
                )}
              </div>
            )}

            {/* Quiz placeholder */}
            {activeLesson.type === "quiz" && (
              <div className="learn-quiz-placeholder">
                <span>📝</span>
                <p>{t("learnPage.quizComingSoon")}</p>
              </div>
            )}

            {/* Lesson info */}
            <div className="learn-lesson-info">
              <div>
                <h2 className="learn-lesson-title">{activeLesson.title}</h2>
                <span className="learn-lesson-type">{activeLesson.type}</span>
              </div>
              <div className="learn-complete-wrap">
                {completeError && <span className="learn-complete-error">{completeError}</span>}
                {!completedIds.has(activeLesson.id) ? (
                  <button
                    className="learn-complete-btn"
                    onClick={() => handleComplete(activeLesson.id)}
                  >
                    {t("learnPage.markComplete")}
                  </button>
                ) : (
                  <span className="learn-completed-badge">{t("learnPage.completed")}</span>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="learn-state">
            <p>{t("learnPage.selectLesson")}</p>
          </div>
        )}
      </main>
    </div>
  );
}
