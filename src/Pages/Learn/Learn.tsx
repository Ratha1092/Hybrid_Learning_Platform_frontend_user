import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, MessageCircle, Check, Hash, FileText, Clock, Tag, File as FileIcon } from "lucide-react";
import api from "../../api/axios";
import { classifyVideoUrl, buildYouTubeEmbed, buildVimeoEmbed, seekEmbeddedVideo } from "../../utils/videoUrl";
import { resolveUrl } from "../../utils/format";
import LessonComments from "../../Components/LessonComments/LessonComments";
import { useAuth } from "../../context/AuthContext";
import { useAuthModal } from "../../context/AuthModalContext";
import TopNavBar from "./TopNavBar";
import CourseProgressCard from "./CourseProgressCard";
import "./Learn.css";

// Fraction of the video that must actually be played (not just seeked past)
// before a lesson auto-completes.
const AUTO_COMPLETE_THRESHOLD = 0.9;
// How often we persist the resume position while playing.
const RESUME_SAVE_INTERVAL_MS = 5000;
// A lesson with a single video keeps the legacy key (`learn:resume:{lessonId}`)
// so existing saved resume positions keep working; a lesson with several
// videos gets one key per part.
const resumeKey = (lessonId: number, videoId?: number) =>
  videoId != null ? `learn:resume:${lessonId}:${videoId}` : `learn:resume:${lessonId}`;

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

// A lesson can hold several videos (e.g. a lecture split into parts).
interface LessonVideoItem {
  id: number;
  video_url?: string | null;
  duration?: number | null;
  order: number;
}

interface LessonItem {
  id: number;
  title: string;
  type: string;
  duration: number;
  is_preview: boolean;
  order: number;
  video_url?: string;
  videos?: LessonVideoItem[];
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
  price: string | number;
  sections: SectionItem[];
  access_expired?: boolean;
  access_expires_at?: string | null;
  category?: { id: number; name: string; slug: string } | null;
  instructor?: { id: number; name: string; avatar?: string | null; avatar_url?: string | null } | null;
  thumbnail_url?: string | null;
}

type LessonTab = "lesson" | "comments";

export default function Learn() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [activeLesson, setActiveLesson] = useState<LessonItem | null>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0]));
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [tab, setTab] = useState<LessonTab>("lesson");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const lastResumeSaveRef = useRef(0);
  const autoCompletingRef = useRef<Set<number>>(new Set());
  const videoElRef = useRef<HTMLVideoElement>(null);
  const iframeElRef = useRef<HTMLIFrameElement>(null);
  const activeMediaKindRef = useRef<"youtube" | "vimeo" | "direct" | null>(null);
  const activeVideoIdRef = useRef<number | null>(null);
  const pendingSeekRef = useRef<number | null>(null);

  const getVideoCurrentTime = (): number | null => {
    if (activeMediaKindRef.current === "direct" && videoElRef.current) {
      return videoElRef.current.currentTime;
    }
    return null;
  };

  const getActiveVideoId = (): number | null => activeVideoIdRef.current;

  const performSeek = (seconds: number) => {
    if (activeMediaKindRef.current === "direct" && videoElRef.current) {
      videoElRef.current.currentTime = seconds;
      videoElRef.current.play().catch(() => {});
    } else if (
      (activeMediaKindRef.current === "youtube" || activeMediaKindRef.current === "vimeo") &&
      iframeElRef.current
    ) {
      seekEmbeddedVideo(iframeElRef.current, activeMediaKindRef.current, seconds);
    }
  };

  const seekActiveVideo = (seconds: number, videoId: number | null) => {
    if (videoId != null && videoId !== activeVideoIdRef.current) {
      const targetIndex = activeLesson?.videos?.findIndex((v) => v.id === videoId) ?? -1;
      if (targetIndex >= 0) {
        pendingSeekRef.current = seconds;
        setActiveVideoIndex(targetIndex);
        return;
      }
    }
    performSeek(seconds);
  };

  useEffect(() => {
    if (!slug) return;

    api.get<{ data: CourseData }>(`/courses/${slug}`)
      .then(async ({ data }) => {
        const courseData = data.data;
        setCourse(courseData);
        const first = courseData.sections?.[0]?.lessons?.[0];
        if (first) setActiveLesson(first);

        // Guests aren't signed in, so there's no progress to load — and the
        // per-lesson requests would just 401.
        if (!isAuthenticated) return;

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
  }, [slug, navigate, isAuthenticated]);

  const handleSelectLesson = (lesson: LessonItem) => {
    setActiveLesson(lesson);
    setActiveVideoIndex(0);
    setCompleteError(null);
    setTab("lesson");
  };

  const handleComplete = async (lessonId: number) => {
    // Guests have nowhere to save progress to — send them to log in instead
    // of silently failing the request.
    if (!isAuthenticated) {
      openLogin();
      return;
    }
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

  const handleVideoProgress = (lessonId: number, video: HTMLVideoElement, videoId?: number, isLastVideo = true) => {
    const now = Date.now();
    if (now - lastResumeSaveRef.current > RESUME_SAVE_INTERVAL_MS) {
      lastResumeSaveRef.current = now;
      if (!completedIds.has(lessonId)) {
        localStorage.setItem(resumeKey(lessonId, videoId), String(video.currentTime));
      }
    }

    if (!isLastVideo || !isAuthenticated) return;
    if (completedIds.has(lessonId) || autoCompletingRef.current.has(lessonId)) return;
    if (playedCoverage(video) >= AUTO_COMPLETE_THRESHOLD) {
      autoCompletingRef.current.add(lessonId);
      handleComplete(lessonId);
    }
  };

  const handleVideoEnded = (lessonId: number) => {
    if (!isAuthenticated) return;
    if (completedIds.has(lessonId) || autoCompletingRef.current.has(lessonId)) return;
    autoCompletingRef.current.add(lessonId);
    handleComplete(lessonId);
  };

  const handleVideoLoadedMetadata = (lessonId: number, video: HTMLVideoElement, videoId?: number) => {
    if (pendingSeekRef.current != null) {
      video.currentTime = pendingSeekRef.current;
      pendingSeekRef.current = null;
      video.play().catch(() => {});
      return;
    }
    const saved = Number(localStorage.getItem(resumeKey(lessonId, videoId)));
    if (saved > 0 && saved < video.duration - 5) {
      video.currentTime = saved;
    }
  };

  const handleEmbedLoad = (kind: "youtube" | "vimeo") => {
    if (pendingSeekRef.current == null) return;
    const seconds = pendingSeekRef.current;
    pendingSeekRef.current = null;
    setTimeout(() => {
      if (iframeElRef.current) seekEmbeddedVideo(iframeElRef.current, kind, seconds);
    }, 800);
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

  // Free courses are watchable as a guest; paid ones still need an account
  // so enrollment/access can be checked.
  if (!isAuthenticated && Number(course.price) !== 0) {
    return (
      <div className="learn-state">
        <p>Please log in to access this course.</p>
        <button onClick={openLogin}>Log in</button>
      </div>
    );
  }

  return (
    <div className="learn-page">
      <TopNavBar
        courseTitle={course.title}
        courseSlug={course.slug}
        lessonTitle={activeLesson?.title ?? ""}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
      />
      <div className="learn-wrap">
      {/* Sidebar */}
      <aside className={`learn-sidebar${sidebarCollapsed ? " learn-sidebar--collapsed" : ""}`}>
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
                      <FileIcon size={12} className="learn-lesson__trailing-icon" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <CourseProgressCard
          thumbnailUrl={resolveUrl(course.thumbnail_url)}
          courseTitle={course.title}
          instructorName={course.instructor?.name}
          progressPercent={completionPct}
        />
      </aside>

      {/* Main content */}
      <main className="learn-main">
        {course.access_expired && (
          <div className="learn-expired-banner">
            <span>⏳ Your access to this course has expired.</span>
            <button onClick={() => navigate(`/courses/${course.slug}`)}>Renew Access</button>
          </div>
        )}
        {activeLesson ? (
          <div className="learn-main__inner">
            {/* Video */}
            {activeLesson.type === "video" && (
              <div className="learn-video-wrap">
                {(() => {
                  const lessonVideos: LessonVideoItem[] = activeLesson.videos?.length
                    ? activeLesson.videos
                    : activeLesson.video_url
                      ? [{ id: activeLesson.id, video_url: activeLesson.video_url, duration: activeLesson.duration, order: 0 }]
                      : [];
                  const hasMultiple = lessonVideos.length > 1;
                  const idx = Math.min(activeVideoIndex, Math.max(lessonVideos.length - 1, 0));
                  const currentVideo = lessonVideos[idx] ?? null;
                  const isLastVideo = idx >= lessonVideos.length - 1;
                  const kind = classifyVideoUrl(currentVideo?.video_url);
                  activeMediaKindRef.current = kind === "direct" || kind === "youtube" || kind === "vimeo" ? kind : null;
                  activeVideoIdRef.current = activeLesson.videos?.length ? (currentVideo?.id ?? null) : null;

                  const selector = hasMultiple ? (
                    <div className="learn-video-parts">
                      {lessonVideos.map((v, i) => (
                        <button
                          key={v.id}
                          onClick={() => setActiveVideoIndex(i)}
                          className={`learn-video-part-btn${i === idx ? " active" : ""}`}
                        >
                          Part {i + 1}
                        </button>
                      ))}
                    </div>
                  ) : null;

                  if (kind === "youtube") return (
                    <>
                      {selector}
                      <iframe
                        ref={iframeElRef}
                        key={currentVideo!.id}
                        src={buildYouTubeEmbed(currentVideo!.video_url!)}
                        title={activeLesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        onLoad={() => handleEmbedLoad("youtube")}
                        className="learn-video"
                      />
                    </>
                  );
                  if (kind === "vimeo") return (
                    <>
                      {selector}
                      <iframe
                        ref={iframeElRef}
                        key={currentVideo!.id}
                        src={buildVimeoEmbed(currentVideo!.video_url!)}
                        title={activeLesson.title}
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        onLoad={() => handleEmbedLoad("vimeo")}
                        className="learn-video"
                      />
                    </>
                  );
                  if (kind === "direct") return (
                    <>
                      {selector}
                      <video
                        ref={videoElRef}
                        key={currentVideo!.id}
                        src={currentVideo!.video_url!}
                        controls
                        controlsList="nodownload"
                        onContextMenu={(e) => e.preventDefault()}
                        onLoadedMetadata={(e) => handleVideoLoadedMetadata(activeLesson.id, e.currentTarget, hasMultiple ? currentVideo!.id : undefined)}
                        onTimeUpdate={(e) => handleVideoProgress(activeLesson.id, e.currentTarget, hasMultiple ? currentVideo!.id : undefined, isLastVideo)}
                        onEnded={() => (isLastVideo ? handleVideoEnded(activeLesson.id) : setActiveVideoIndex(idx + 1))}
                        className="learn-video"
                        style={{ background: "#000" }}
                      />
                    </>
                  );
                  if (currentVideo?.video_url) return (
                    <>
                      {selector}
                      <div className="learn-no-video">
                        <span>🚫</span>
                        <p>Invalid video URL.</p>
                      </div>
                    </>
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

            {/* Control bar */}
            <div className="learn-control-bar">
              <button
                className="learn-icon-btn"
                disabled={!prevLesson}
                onClick={() => prevLesson && handleSelectLesson(prevLesson)}
                title="Previous lesson"
                aria-label="Previous lesson"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="learn-control-bar__center">
                {completeError && <span className="learn-complete-error">{completeError}</span>}
                {!isAuthenticated ? (
                  <button className="learn-complete-btn" onClick={openLogin}>
                    <Check size={15} /> Log in to save progress
                  </button>
                ) : !completedIds.has(activeLesson.id) ? (
                  <button
                    className="learn-complete-btn"
                    onClick={() => handleComplete(activeLesson.id)}
                  >
                    <Check size={15} /> Mark as Complete
                  </button>
                ) : (
                  <span className="learn-completed-badge"><Check size={14} /> Completed</span>
                )}
                <button
                  className="learn-icon-btn"
                  onClick={() => setTab("comments")}
                  title="Jump to comments"
                  aria-label="Jump to comments"
                >
                  <MessageCircle size={18} />
                </button>
              </div>

              <button
                className="learn-icon-btn"
                disabled={!nextLesson}
                onClick={() => nextLesson && handleSelectLesson(nextLesson)}
                title="Next lesson"
                aria-label="Next lesson"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Lesson meta + tabs, two columns */}
            <div className="learn-content-grid">
              <div className="learn-content-left">
                <h2 className="learn-lesson-title">{activeLesson.title}</h2>

                <ul className="learn-meta-list">
                  {activeIndex >= 0 && (
                    <li>
                      <span className="learn-meta-list__label"><Hash size={14} /> Episode</span>
                      <strong>{activeIndex + 1}</strong>
                    </li>
                  )}
                  <li>
                    <span className="learn-meta-list__label"><FileText size={14} /> Type</span>
                    <strong className="learn-meta-list__capitalize">{activeLesson.type}</strong>
                  </li>
                  {activeLesson.duration > 0 && (
                    <li>
                      <span className="learn-meta-list__label"><Clock size={14} /> Duration</span>
                      <strong>{Math.floor(activeLesson.duration / 60)}m</strong>
                    </li>
                  )}
                  {course.category?.name && (
                    <li>
                      <span className="learn-meta-list__label"><Tag size={14} /> Category</span>
                      <strong>{course.category.name}</strong>
                    </li>
                  )}
                </ul>

                {course.instructor?.name && (
                  <div className="learn-instructor">
                    <div className="learn-instructor__avatar">
                      {(() => {
                        // avatar_url is the backend's already-resolved absolute
                        // URL; the raw avatar column is just a storage path
                        // resolveUrl can only guess at, so avatar_url wins.
                        const instructorAvatarUrl = course.instructor!.avatar_url ?? resolveUrl(course.instructor!.avatar);
                        return instructorAvatarUrl ? (
                          <img src={instructorAvatarUrl} alt={course.instructor!.name} />
                        ) : (
                          <span>{course.instructor!.name.charAt(0).toUpperCase()}</span>
                        );
                      })()}
                    </div>
                    <div>
                      <p className="learn-instructor__label">Your Instructor</p>
                      <p className="learn-instructor__name">{course.instructor.name}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="learn-content-right">
                <div className="learn-tabs">
                  <button
                    className={`learn-tab${tab === "lesson" ? " learn-tab--active" : ""}`}
                    onClick={() => setTab("lesson")}
                  >
                    Lesson
                  </button>
                  <button
                    className={`learn-tab${tab === "comments" ? " learn-tab--active" : ""}`}
                    onClick={() => setTab("comments")}
                  >
                    Comments
                  </button>
                </div>

                <div className="learn-tab-panel" hidden={tab !== "lesson"}>
                  {activeLesson.description && (
                    <p className="learn-lesson-desc">{activeLesson.description}</p>
                  )}

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

                  {!activeLesson.description && !activeLesson.attachments?.length && (
                    <p className="learn-empty">No additional details for this lesson.</p>
                  )}
                </div>

                {/* Kept mounted (just hidden) rather than conditionally rendered —
                    switching tabs otherwise unmounted this and threw away its
                    fetched comments, forcing a fresh load + spinner every time. */}
                <div className="learn-tab-panel learn-tab-panel--comments" hidden={tab !== "comments"}>
                  <LessonComments
                    lessonId={activeLesson.id}
                    getCurrentTime={activeLesson.type === "video" ? getVideoCurrentTime : undefined}
                    getVideoId={activeLesson.type === "video" ? getActiveVideoId : undefined}
                    onSeek={activeLesson.type === "video" ? seekActiveVideo : undefined}
                  />
                </div>
              </div>
            </div>

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
          </div>
        ) : (
          <div className="learn-state">
            <p>Select a lesson from the sidebar to start learning.</p>
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
