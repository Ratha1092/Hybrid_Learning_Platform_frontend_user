import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { courseService, type EnrolledCourse } from "../../../services/courseService";
import { useStudentProfile } from "../../../hooks/useStudentProfile";
import "./StudentProfile.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
function resolveUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

type Tab = "overview" | "courses";

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("overview");
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [coursesError, setCoursesError] = useState(false);

  const { profile: studentProfile, loading: loadingProfile } = useStudentProfile();

  useEffect(() => {
    if (!isAuthenticated) navigate("/PageLogin");
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated || tab !== "courses") return;
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const { data } = await courseService.getEnrolled();
        setCourses(data.data ?? []);
      } catch {
        setCoursesError(true);
      }
      setLoadingCourses(false);
    };
    fetchCourses();
  }, [isAuthenticated, tab]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const avatarSrc = studentProfile?.avatar ?? user?.avatar_url ?? user?.avatar ?? null;
  const displayName = studentProfile?.name || user?.name || "—";
  const firstName = displayName.split(" ")[0];

  return (
    <div className="profile-page">
      <div className="profile-container">

        {/* ── Left: User Card ── */}
        <aside className="profile-card">
          <div className="profile-card-banner" />

          <div className="profile-card-body">
            <div className="profile-avatar">
              {avatarSrc ? (
                <img src={avatarSrc} alt={displayName} />
              ) : (
                <span>{displayName.charAt(0).toUpperCase()}</span>
              )}
            </div>

            <p className="profile-welcome">Welcome back</p>
            <h2 className="profile-name">{displayName}</h2>
            <p className="profile-email">{user?.email ?? "—"}</p>

            <div className="profile-meta">
              {studentProfile?.phone && (
                <div className="profile-meta-row">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.62 4.4 2 2 0 0 1 3.6 2.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  {studentProfile.phone}
                </div>
              )}
              {user?.created_at && (
                <div className="profile-meta-row">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Joined {new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </div>
              )}
            </div>

            {(studentProfile?.github || studentProfile?.linkedin) && (
              <>
                <div className="profile-divider" />
                <div className="profile-socials">
                  {studentProfile.github && (
                    <a href={studentProfile.github} target="_blank" rel="noreferrer" className="profile-social-link">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                      </svg>
                      GitHub
                    </a>
                  )}
                  {studentProfile.linkedin && (
                    <a href={studentProfile.linkedin} target="_blank" rel="noreferrer" className="profile-social-link profile-social-link--linkedin">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      LinkedIn
                    </a>
                  )}
                </div>
              </>
            )}

            <div className="profile-divider" />

            <div className="profile-actions">
              <button className="profile-btn profile-btn--edit" onClick={() => navigate("/profile/edit")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit Profile
              </button>
              <button className="profile-btn profile-btn--logout" onClick={handleLogout}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Log Out
              </button>
            </div>
          </div>
        </aside>

        {/* ── Right: Main panel ── */}
        <main className="profile-main">
          <div className="profile-tabs">
            <button
              className={`profile-tab${tab === "overview" ? " profile-tab--active" : ""}`}
              onClick={() => setTab("overview")}
            >
              Overview
            </button>
            <button
              className={`profile-tab${tab === "courses" ? " profile-tab--active" : ""}`}
              onClick={() => setTab("courses")}
            >
              My Courses
              {courses.length > 0 && <span className="profile-count">{courses.length}</span>}
            </button>
          </div>

          {/* ── Tab: Overview ── */}
          {tab === "overview" && (
            <>
              {loadingProfile ? (
                <div className="profile-state">
                  <div className="profile-spinner" />
                  <p>Loading profile...</p>
                </div>
              ) : (
                <div className="profile-overview">
                  <div className="profile-greeting">
                    <h2>Hello, {firstName}</h2>
                    <p>Here's your learning profile</p>
                  </div>

                  <div className="profile-info-block">
                    <h3 className="profile-info-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      Bio
                    </h3>
                    <p className="profile-info-value">
                      {studentProfile?.bio || <span className="profile-info-empty">No bio yet. Click Edit Profile to add one.</span>}
                    </p>
                  </div>

                  <div className="profile-info-block">
                    <h3 className="profile-info-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      Learning Goals
                    </h3>
                    <p className="profile-info-value">
                      {studentProfile?.learning_goals || <span className="profile-info-empty">No learning goals set.</span>}
                    </p>
                  </div>

                  <div className="profile-info-block">
                    <h3 className="profile-info-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      Interests
                    </h3>
                    {studentProfile?.interests && studentProfile.interests.length > 0 ? (
                      <div className="profile-tags">
                        {studentProfile.interests.map((tag) => (
                          <span key={tag} className="profile-tag">{tag}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="profile-info-empty">No interests listed.</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Tab: My Courses ── */}
          {tab === "courses" && (
            <>
              <div className="profile-courses-header">
                <h2 className="profile-section-title">
                  My Courses
                  {courses.length > 0 && <span className="profile-count">{courses.length}</span>}
                </h2>
              </div>

              {loadingCourses ? (
                <div className="profile-state">
                  <div className="profile-spinner" />
                  <p>Loading courses...</p>
                </div>
              ) : coursesError ? (
                <div className="profile-empty">
                  <p>Failed to load courses. Please try again.</p>
                  <button onClick={() => { setCoursesError(false); setTab("overview"); setTimeout(() => setTab("courses"), 0); }}>
                    Retry
                  </button>
                </div>
              ) : courses.length === 0 ? (
                <div className="profile-empty">
                  <div className="profile-empty-icon">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                  </div>
                  <p>You haven't enrolled in any courses yet.</p>
                  <button onClick={() => navigate("/courses")}>Browse Courses</button>
                </div>
              ) : (
                <div className="profile-courses">
                  {courses.map((course) => (
                    <div key={course.enrollment_id} className="profile-course-card" onClick={() => navigate(`/courses/${course.course_slug ?? course.course_id}`)}>
                      {resolveUrl(course.course_thumbnail) ? (
                        <img
                          src={resolveUrl(course.course_thumbnail)!}
                          alt={course.course_title}
                          className="profile-course-thumb"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ) : (
                        <div className="profile-course-thumb profile-course-thumb--placeholder">🎓</div>
                      )}
                      <div className="profile-course-info">
                        <h3>{course.course_title}</h3>
                        <span className="profile-course-level">{course.course_level}</span>
                        <div className="profile-progress">
                          <div className="profile-progress__track">
                            <div className="profile-progress__bar" style={{ width: `${course.progress_percentage}%` }} />
                          </div>
                          <span>{course.progress_percentage}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
