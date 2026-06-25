import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import "./Learn.css";

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

  const [course, setCourse] = useState<CourseData | null>(null);
  const [activeLesson, setActiveLesson] = useState<LessonItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/PageLogin");
      return;
    }
    if (!slug) return;

    api.get<{ data: CourseData }>(`/courses/${slug}`)
      .then(({ data }) => {
        setCourse(data.data);
        const first = data.data.sections?.[0]?.lessons?.[0];
        if (first) setActiveLesson(first);
      })
      .catch(() => setError("Failed to load course."))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  const handleSelectLesson = (lesson: LessonItem) => {
    setActiveLesson(lesson);
  };

  const handleComplete = async (lessonId: number) => {
    try {
      await api.post(`/lessons/${lessonId}/progress`, {
        completed: true,
        progress_percentage: 100,
      });
      setCompletedIds((prev) => new Set([...prev, lessonId]));
    } catch {
      // silent
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
            {completedIds.size} / {totalLessons} lessons
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
            <span>⏳ Your access to this course has expired.</span>
            <button onClick={() => navigate(`/courses/${course.slug}`)}>Renew Access</button>
          </div>
        )}
        {activeLesson ? (
          <>
            {/* Video */}
            {activeLesson.type === "video" && (
              <div className="learn-video-wrap">
                {activeLesson.video_url ? (
                  /youtube\.com|youtu\.be/.test(activeLesson.video_url) ? (
                    <iframe
                      src={activeLesson.video_url.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/")}
                      title={activeLesson.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="learn-video"
                    />
                  ) : /vimeo\.com/.test(activeLesson.video_url) ? (
                    <iframe
                      src={activeLesson.video_url.replace("vimeo.com/", "player.vimeo.com/video/")}
                      title={activeLesson.title}
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      className="learn-video"
                    />
                  ) : (
                    <video
                      src={activeLesson.video_url}
                      controls
                      className="learn-video"
                      style={{ background: "#000" }}
                    />
                  )
                ) : course.access_expired && !activeLesson.is_preview ? (
                  <div className="learn-no-video">
                    <span>⏳</span>
                    <p>Your access has expired. Renew to keep watching.</p>
                  </div>
                ) : (
                  <div className="learn-no-video">
                    <span>🎬</span>
                    <p>No video URL provided for this lesson.</p>
                  </div>
                )}
              </div>
            )}

            {/* Article */}
            {activeLesson.type === "article" && (
              <div className="learn-article">
                {activeLesson.content ? (
                  <p>{activeLesson.content}</p>
                ) : (
                  <p className="learn-empty">No content provided for this lesson.</p>
                )}
              </div>
            )}

            {/* Quiz placeholder */}
            {activeLesson.type === "quiz" && (
              <div className="learn-quiz-placeholder">
                <span>📝</span>
                <p>Quiz coming soon.</p>
              </div>
            )}

            {/* Lesson info */}
            <div className="learn-lesson-info">
              <div>
                <h2 className="learn-lesson-title">{activeLesson.title}</h2>
                <span className="learn-lesson-type">{activeLesson.type}</span>
              </div>
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
